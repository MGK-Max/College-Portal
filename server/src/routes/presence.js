const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/presence - Live locator showing who is on leave and where present staff/students are
router.get('/', authenticateToken, (req, res) => {
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const currentDay = days[now.getDay()] === 'Sunday' ? 'Monday' : days[now.getDay()]; // Fallback to Monday if weekend
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMin}`;

    // 1. Get today's active approved leaves
    const activeLeaves = db.prepare(`
      SELECT user_id, leave_type, reason, from_date, to_date
      FROM leave_requests
      WHERE date('now') BETWEEN from_date AND to_date AND status = 'APPROVED'
    `).all();
    const leaveMap = new Map();
    activeLeaves.forEach(l => leaveMap.set(l.user_id, l));

    // 2. Fetch all faculty with department info
    const faculty = db.prepare(`
      SELECT f.id as faculty_id, f.faculty_code, f.designation, u.id as user_id, u.name, u.email, u.avatar_url,
        d.id as department_id, d.name as department_name, d.code as department_code, d.category as department_category
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      JOIN departments d ON d.id = f.department_id
      ORDER BY d.name, u.name
    `).all();

    // 3. For each faculty, determine presence and real-time location
    const facultyPresence = faculty.map(f => {
      const onLeave = leaveMap.get(f.user_id);
      if (onLeave) {
        return {
          ...f,
          status: 'ON_LEAVE',
          statusLabel: 'On Leave',
          location: `On Leave: ${onLeave.leave_type}`,
          reason: onLeave.reason
        };
      }

      // Check current timetable for active class
      const activeClass = db.prepare(`
        SELECT tt.*, s.name as subject_name, s.code as subject_code,
          c.room_no, sec.name as section_name, c.year_level
        FROM timetable tt
        JOIN subjects s ON s.id = tt.subject_id
        JOIN classes c ON c.id = tt.class_id
        JOIN sections sec ON sec.id = c.section_id
        WHERE tt.faculty_id = ? AND tt.day_of_week = ?
        ORDER BY tt.period_num ASC
      `).all(f.faculty_id, currentDay);

      // Check if current simulated time is within class period or take the first scheduled class today
      const currentLecture = activeClass.find(tt => currentTime >= tt.start_time && currentTime <= tt.end_time) || activeClass[0];

      if (currentLecture) {
        return {
          ...f,
          status: 'PRESENT',
          statusLabel: 'In Class',
          location: `Room ${currentLecture.classroom || currentLecture.room_no} • Period ${currentLecture.period_num} (${currentLecture.subject_code} - ${currentLecture.section_name})`,
          currentClass: `${currentLecture.subject_name}`,
          isTeachingNow: true
        };
      }

      return {
        ...f,
        status: 'PRESENT',
        statusLabel: 'In Staff Room',
        location: `${f.department_code} Department Faculty Cabin (Block A)`,
        isTeachingNow: false
      };
    });

    // 4. Deans Presence
    const deans = db.prepare(`
      SELECT d.*, u.name, u.email, u.avatar_url
      FROM deans d
      JOIN users u ON u.id = d.user_id
    `).all();

    const deanPresence = deans.map(d => {
      const onLeave = leaveMap.get(d.user_id);
      return {
        ...d,
        user_role: 'DEAN',
        status: onLeave ? 'ON_LEAVE' : 'PRESENT',
        statusLabel: onLeave ? 'On Leave' : 'In Office',
        location: onLeave ? `On Leave: ${onLeave.leave_type}` : d.office_room || 'Dean Suite A-101 (Cluster Directorate)'
      };
    });

    // 5. HODs Presence
    const hods = db.prepare(`
      SELECT h.*, u.name, u.email, u.avatar_url, d.name as department_name, d.code as department_code
      FROM hods h
      JOIN users u ON u.id = h.user_id
      JOIN departments d ON d.id = h.department_id
    `).all();

    const hodPresence = hods.map(h => {
      const onLeave = leaveMap.get(h.user_id);
      return {
        ...h,
        user_role: 'HOD',
        status: onLeave ? 'ON_LEAVE' : 'PRESENT',
        statusLabel: onLeave ? 'On Leave' : 'In HOD Office',
        location: onLeave ? `On Leave: ${onLeave.leave_type}` : `${h.department_code} Department HOD Chamber (Room H101)`
      };
    });

    // 6. Sample Students Presence in user's department
    const userDeptId = req.user.departmentId || 1;
    const students = db.prepare(`
      SELECT s.id as student_id, s.register_no, s.year_level, u.id as user_id, u.name, u.avatar_url,
        sec.name as section_name, c.room_no
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN sections sec ON sec.id = c.section_id
      WHERE s.department_id = ?
      LIMIT 12
    `).all(userDeptId);

    const studentPresence = students.map(st => {
      const onLeave = leaveMap.get(st.user_id);
      return {
        ...st,
        user_role: 'STUDENT',
        status: onLeave ? 'ON_LEAVE' : 'PRESENT',
        statusLabel: onLeave ? 'On Leave' : 'In Class',
        location: onLeave ? `On Leave: ${onLeave.leave_type}` : `Attending Class in Room ${st.room_no || 'A204'}`
      };
    });

    res.json({
      timestamp: now.toISOString(),
      currentTime,
      currentDay,
      summary: {
        totalFaculty: faculty.length,
        facultyOnLeave: facultyPresence.filter(f => f.status === 'ON_LEAVE').length,
        facultyPresent: facultyPresence.filter(f => f.status === 'PRESENT').length
      },
      deans: deanPresence,
      hods: hodPresence,
      faculty: facultyPresence,
      students: studentPresence
    });
  } catch (err) {
    console.error('Error fetching live presence:', err);
    res.status(500).json({ error: 'Failed to fetch presence data' });
  }
});

module.exports = router;
