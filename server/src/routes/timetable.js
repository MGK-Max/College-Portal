const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

function getCurrentDayOfWeek() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  // If Sunday in test environment, default to Monday for demonstration
  return today === 'Sunday' ? 'Monday' : today;
}

// GET /api/timetable - Timetable list with filters
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT t.id, t.day_of_week, t.period_num, t.start_time, t.end_time, t.classroom,
             s.id as subject_id, s.code as subject_code, s.name as subject_name,
             f.id as faculty_id, u.name as faculty_name, f.faculty_code,
             c.id as class_id, c.year_level, c.semester_num, sec.name as section_name,
             d.id as department_id, d.name as department_name, d.code as department_code
      FROM timetable t
      JOIN subjects s ON s.id = t.subject_id
      JOIN faculty f ON f.id = t.faculty_id
      JOIN users u ON u.id = f.user_id
      JOIN classes c ON c.id = t.class_id
      JOIN sections sec ON sec.id = c.section_id
      JOIN departments d ON d.id = c.department_id
      WHERE 1=1
    `;

    const params = [];

    if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` AND d.id = ?`;
      params.push(req.user.departmentId);
    } else if (req.user.role === 'FACULTY' && req.user.facultyId) {
      query += ` AND t.faculty_id = ?`;
      params.push(req.user.facultyId);
    } else if (req.user.role === 'STUDENT' && req.user.classId) {
      query += ` AND t.class_id = ?`;
      params.push(req.user.classId);
    }

    if (req.query.department_id) {
      query += ` AND d.id = ?`;
      params.push(req.query.department_id);
    }

    if (req.query.class_id) {
      query += ` AND t.class_id = ?`;
      params.push(req.query.class_id);
    }

    if (req.query.day_of_week) {
      query += ` AND t.day_of_week = ?`;
      params.push(req.query.day_of_week);
    }

    query += ` ORDER BY CASE t.day_of_week 
                WHEN 'Monday' THEN 1 
                WHEN 'Tuesday' THEN 2 
                WHEN 'Wednesday' THEN 3 
                WHEN 'Thursday' THEN 4 
                WHEN 'Friday' THEN 5 
                WHEN 'Saturday' THEN 6 
                ELSE 7 END, t.period_num ASC`;

    const timetable = db.prepare(query).all(...params);
    res.json(timetable);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// GET /api/timetable/today - Today's classes tailored by role
router.get('/today', authenticateToken, (req, res) => {
  try {
    const todayDay = getCurrentDayOfWeek();
    const todayDate = new Date().toISOString().split('T')[0];

    let query = `
      SELECT t.id as timetable_id, t.day_of_week, t.period_num, t.start_time, t.end_time, t.classroom,
             s.id as subject_id, s.code as subject_code, s.name as subject_name,
             f.id as faculty_id, u.name as faculty_name, f.faculty_code,
             c.id as class_id, c.year_level, c.semester_num, sec.name as section_name,
             d.id as department_id, d.name as department_name, d.code as department_code,
             (SELECT COUNT(*) FROM student_classes sc WHERE sc.class_id = c.id) as enrolled_students_count,
             (SELECT COUNT(*) FROM attendance a WHERE a.class_id = c.id AND a.date = ? AND a.period = t.period_num) as attendance_records_count
      FROM timetable t
      JOIN subjects s ON s.id = t.subject_id
      JOIN faculty f ON f.id = t.faculty_id
      JOIN users u ON u.id = f.user_id
      JOIN classes c ON c.id = t.class_id
      JOIN sections sec ON sec.id = c.section_id
      JOIN departments d ON d.id = c.department_id
      WHERE t.day_of_week = ?
    `;

    const params = [todayDate, todayDay];

    if (req.user.role === 'FACULTY' && req.user.facultyId) {
      query += ` AND t.faculty_id = ?`;
      params.push(req.user.facultyId);
    } else if (req.user.role === 'STUDENT' && req.user.classId) {
      query += ` AND t.class_id = ?`;
      params.push(req.user.classId);
    } else if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` AND d.id = ?`;
      params.push(req.user.departmentId);
    }

    query += ` ORDER BY t.period_num ASC`;

    const classes = db.prepare(query).all(...params);

    const result = classes.map(cls => ({
      ...cls,
      isAttendanceMarked: cls.attendance_records_count > 0,
      todayDate,
      todayDay
    }));

    res.json({
      dayOfWeek: todayDay,
      date: todayDate,
      classes: result
    });
  } catch (error) {
    console.error('Error fetching today\'s timetable:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s timetable' });
  }
});

// POST /api/timetable (Faculty, HOD, Dean, Admin)
router.post('/', authenticateToken, requireRoles('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { day_of_week, period_num, start_time, end_time, subject_id, faculty_id, class_id, classroom } = req.body;

  const facId = faculty_id || req.user.facultyId;

  if (!day_of_week || !period_num || !start_time || !end_time || !subject_id || !facId || !class_id || !classroom) {
    return res.status(400).json({ error: 'All timetable fields (day, period, start/end time, subject, faculty, class, classroom) are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO timetable (day_of_week, period_num, start_time, end_time, subject_id, faculty_id, class_id, classroom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(day_of_week, Number(period_num), start_time, end_time, Number(subject_id), Number(facId), Number(class_id), classroom.trim());

    res.status(201).json({ id: result.lastInsertRowid, message: 'Timetable entry added successfully' });
  } catch (error) {
    console.error('Error adding timetable entry:', error);
    res.status(500).json({ error: 'Failed to add timetable entry' });
  }
});

// PUT /api/timetable/:id (Faculty, HOD, Dean, Admin)
router.put('/:id', authenticateToken, requireRoles('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { day_of_week, period_num, start_time, end_time, subject_id, faculty_id, class_id, classroom } = req.body;
  const id = Number(req.params.id);

  try {
    const existing = db.prepare(`SELECT * FROM timetable WHERE id = ?`).get(id);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });

    // If faculty, verify it's their own or they teach it
    if (req.user.role === 'FACULTY' && req.user.facultyId && existing.faculty_id !== req.user.facultyId) {
      // Allow if faculty is mentor of that class
      const isMentor = db.prepare(`SELECT id FROM classes WHERE id = ? AND (mentor1_id = ? OR mentor2_id = ?)`).get(existing.class_id, req.user.facultyId, req.user.facultyId);
      if (!isMentor) {
        return res.status(403).json({ error: 'You can only arrange your own classes or mentored classes' });
      }
    }

    db.prepare(`
      UPDATE timetable 
      SET day_of_week = COALESCE(?, day_of_week),
          period_num = COALESCE(?, period_num),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          subject_id = COALESCE(?, subject_id),
          faculty_id = COALESCE(?, faculty_id),
          class_id = COALESCE(?, class_id),
          classroom = COALESCE(?, classroom)
      WHERE id = ?
    `).run(
      day_of_week || null,
      period_num ? Number(period_num) : null,
      start_time || null,
      end_time || null,
      subject_id ? Number(subject_id) : null,
      faculty_id ? Number(faculty_id) : null,
      class_id ? Number(class_id) : null,
      classroom ? classroom.trim() : null,
      id
    );

    res.json({ message: 'Timetable entry updated successfully' });
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    res.status(500).json({ error: 'Failed to update timetable entry' });
  }
});

// DELETE /api/timetable/:id (Faculty, HOD, Dean, Admin)
router.delete('/:id', authenticateToken, requireRoles('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = db.prepare(`SELECT * FROM timetable WHERE id = ?`).get(id);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });

    db.prepare(`DELETE FROM timetable WHERE id = ?`).run(id);
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
});

module.exports = router;
