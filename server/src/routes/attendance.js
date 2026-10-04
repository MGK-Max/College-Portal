const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Helper to get setting from DB
function getSetting(key, defaultValue) {
  try {
    const row = db.prepare(`SELECT setting_value FROM attendance_settings WHERE setting_key = ?`).get(key);
    return row ? row.setting_value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// GET /api/attendance/class-session
// Fetches session context, student roster, approved ODs, and server-side late window calculation
router.get('/class-session', authenticateToken, (req, res) => {
  const { class_id, subject_id, date, period } = req.query;

  if (!class_id || !subject_id || !date || !period) {
    return res.status(400).json({ error: 'class_id, subject_id, date, and period are required' });
  }

  try {
    // 1. Get class & subject metadata
    const sessionInfo = db.prepare(`
      SELECT 
        c.id as class_id, c.year_level, c.semester_num, c.room_no, c.academic_year,
        sec.name as section_name,
        d.id as department_id, d.name as department_name, d.code as department_code,
        s.id as subject_id, s.code as subject_code, s.name as subject_name, s.credits,
        t.start_time, t.end_time, t.classroom
      FROM classes c
      JOIN sections sec ON sec.id = c.section_id
      JOIN departments d ON d.id = c.department_id
      JOIN subjects s ON s.id = ?
      LEFT JOIN timetable t ON t.class_id = c.id AND t.subject_id = s.id AND t.period_num = ?
      WHERE c.id = ?
    `).get(subject_id, period, class_id);

    if (!sessionInfo) {
      return res.status(404).json({ error: 'Class session details not found' });
    }

    // 2. Server Time & Late Window Calculation
    const serverNow = new Date();
    const serverDateStr = serverNow.toISOString().split('T')[0];
    
    // Class start time string (e.g., "09:00")
    const startTimeStr = sessionInfo.start_time || '09:00';
    const [startH, startM] = startTimeStr.split(':').map(Number);
    
    const classStartDateTime = new Date(date);
    classStartDateTime.setHours(startH, startM, 0, 0);

    const lateAllowanceMinutes = Number(getSetting('late_allowance_minutes', '5'));
    
    const attendanceCloseDateTime = new Date(classStartDateTime.getTime() + lateAllowanceMinutes * 60 * 1000);

    // Calculate remaining seconds if today's date
    const diffMs = attendanceCloseDateTime.getTime() - serverNow.getTime();
    const secondsRemaining = Math.max(0, Math.floor(diffMs / 1000));
    
    // Window is open if date is today and serverNow is between classStart and attendanceClose,
    // OR if faculty is viewing session on that day.
    const isToday = date === serverDateStr;
    const isWindowOpen = isToday ? (serverNow >= classStartDateTime && serverNow <= attendanceCloseDateTime) : true;

    // 3. Fetch Enrolled Students in this class
    const students = db.prepare(`
      SELECT s.id as student_id, s.register_no, u.name, u.email, u.avatar_url
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN student_classes sc ON sc.student_id = s.id
      WHERE sc.class_id = ?
      ORDER BY s.register_no ASC
    `).all(class_id);

    // 4. Fetch already saved attendance records for this session (if any)
    const existingRecords = db.prepare(`
      SELECT student_id, status, late_flag, late_reason, late_reason_accepted, late_approved_by, marked_at
      FROM attendance
      WHERE class_id = ? AND subject_id = ? AND date = ? AND period = ?
    `).all(class_id, subject_id, date, period);

    const existingMap = new Map();
    existingRecords.forEach(r => existingMap.set(r.student_id, r));

    // 5. Fetch Approved On-Duty (OD) for this date
    const approvedODs = db.prepare(`
      SELECT o.student_id, o.event_name, o.from_time, o.to_time
      FROM od_requests o
      WHERE o.date = ? AND o.status = 'HOD_APPROVED'
    `).all(date);

    const odMap = new Map();
    approvedODs.forEach(od => odMap.set(od.student_id, od));

    // 6. Build Student list with computed status
    const studentRoster = students.map(st => {
      const existing = existingMap.get(st.id);
      const approvedOD = odMap.get(st.id);

      let status = 'ABSENT';
      let isOD = false;
      let odEvent = null;

      if (approvedOD) {
        // Automatic OD!
        status = 'OD';
        isOD = true;
        odEvent = approvedOD.event_name;
      } else if (existing) {
        status = existing.status;
      }

      return {
        student_id: st.id,
        register_no: st.register_no,
        name: st.name,
        email: st.email,
        avatar_url: st.avatar_url,
        current_status: status,
        is_auto_od: isOD,
        od_event_name: odEvent,
        already_saved: !!existing,
        late_flag: existing ? existing.late_flag : 0,
        late_reason: existing ? existing.late_reason : null,
        late_reason_accepted: existing ? existing.late_reason_accepted : 0,
        late_approved_by: existing ? existing.late_approved_by : null
      };
    });

    const isAlreadySubmitted = existingRecords.length > 0;

    // Staff in-charge of this period lookup (Prompt Requirement: Staff can poll attendance if they are incharge of that period)
    const incharge = db.prepare(`
      SELECT f.id, f.faculty_code, u.name as faculty_name, u.email
      FROM timetable t
      JOIN faculty f ON f.id = t.faculty_id
      JOIN users u ON u.id = f.user_id
      WHERE t.class_id = ? AND t.period_num = ?
    `).get(Number(class_id), Number(period));

    const canPollAttendance = req.user.role === 'SUPER_ADMIN' || req.user.role === 'HOD' ||
      (req.user.role === 'FACULTY' && incharge && incharge.id === req.user.facultyId);

    res.json({
      sessionInfo: {
        ...sessionInfo,
        date,
        period: Number(period),
        incharge_faculty: incharge || null,
        can_poll_attendance: canPollAttendance
      },
      timePolicy: {
        serverNow: serverNow.toISOString(),
        serverTimeFormatted: serverNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        startTime: startTimeStr,
        lateAllowanceMinutes,
        closesAtTime: attendanceCloseDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        secondsRemaining,
        isWindowOpen,
        isToday
      },
      isAlreadySubmitted,
      students: studentRoster,
      inchargeFaculty: incharge || null,
      canPollAttendance,
      collegeName: getSetting('college_name', 'Kalaignarkaruanidhi Institute of Technology')
    });
  } catch (error) {
    console.error('Error fetching class session attendance:', error);
    res.status(500).json({ error: 'Failed to load class attendance session' });
  }
});

// POST /api/attendance/submit
// Submits attendance with STRICT incharge-of-period verification and 5-minute late rule validation!
router.post('/submit', authenticateToken, requireRoles('FACULTY', 'SUPER_ADMIN', 'HOD'), (req, res) => {
  const { class_id, subject_id, date, period, records, simulated_minutes_late, bypass_late_rule } = req.body;

  if (!class_id || !subject_id || !date || !period || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid attendance submission payload' });
  }

  try {
    // Prompt Requirement: The staff can poll attendance ONLY if they are the incharge of that period!
    if (req.user.role === 'FACULTY') {
      const incharge = db.prepare(`
        SELECT f.id, u.name as faculty_name, f.faculty_code
        FROM timetable t
        JOIN faculty f ON f.id = t.faculty_id
        JOIN users u ON u.id = f.user_id
        WHERE t.class_id = ? AND t.period_num = ?
      `).get(Number(class_id), Number(period));

      const assignment = db.prepare(`
        SELECT id FROM faculty_subjects 
        WHERE faculty_id = ? AND subject_id = ? AND class_id = ?
      `).get(req.user.facultyId, subject_id, class_id);

      if (incharge && incharge.id !== req.user.facultyId) {
        return res.status(403).json({
          error: `Access Denied: Only the staff member assigned in-charge of Period ${period} (${incharge.faculty_name} - ${incharge.faculty_code}) can poll and mark attendance.`
        });
      } else if (!incharge && !assignment) {
        return res.status(403).json({ error: 'You are not assigned as the in-charge faculty for this period.' });
      }
    }

    // 1. Check late rule policy
    const lateAllowance = Number(getSetting('late_allowance_minutes', '5'));

    // Timetable start time
    const tt = db.prepare(`
      SELECT start_time FROM timetable WHERE class_id = ? AND subject_id = ? AND period_num = ?
    `).get(class_id, subject_id, period);

    const startTimeStr = tt ? tt.start_time : '09:00';
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const serverNow = new Date();

    const classStartTime = new Date(date);
    classStartTime.setHours(startH, startM, 0, 0);

    // Calculate actual elapsed minutes
    let elapsedMinutes = Math.floor((serverNow.getTime() - classStartTime.getTime()) / (60 * 1000));
    
    // Support simulated test override if explicitly passed for demonstration
    if (simulated_minutes_late !== undefined && simulated_minutes_late !== null) {
      elapsedMinutes = Number(simulated_minutes_late);
    }

    // Strict 5-Minute Late Rule Verification:
    // If difference > lateAllowance and bypass is not set:
    // Any student marked PRESENT cannot be accepted as PRESENT;
    // Status must be converted to ABSENT with late penalty notice.
    const isLateWindowExceeded = elapsedMinutes > lateAllowance && !bypass_late_rule;

    const facultyId = req.user.role === 'FACULTY' ? req.user.facultyId : 1;
    const nowIso = new Date().toISOString();

    let presentCount = 0;
    let absentCount = 0;
    let odCount = 0;
    let lateEnforcedCount = 0;

    const insertOrReplace = db.prepare(`
      INSERT INTO attendance (student_id, subject_id, class_id, faculty_id, date, period, status, late_flag, late_reason, late_reason_accepted, late_approved_by, late_approved_at, marked_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, class_id, date, period) DO UPDATE SET
        status = excluded.status,
        late_flag = excluded.late_flag,
        late_reason = excluded.late_reason,
        late_reason_accepted = excluded.late_reason_accepted,
        late_approved_by = excluded.late_approved_by,
        late_approved_at = excluded.late_approved_at,
        updated_at = excluded.updated_at
    `);

    // Fetch approved ODs
    const approvedODs = db.prepare(`
      SELECT student_id FROM od_requests WHERE date = ? AND status = 'HOD_APPROVED'
    `).all(date);
    const approvedODSet = new Set(approvedODs.map(o => o.student_id));

    // Process every student record atomically
    db.exec('BEGIN TRANSACTION;');

    try {
      for (const rec of records) {
        let finalStatus = rec.status;
        let lateFlag = rec.late_flag ? 1 : 0;
        let lateReason = rec.late_reason || null;
        let lateReasonAccepted = rec.late_reason_accepted ? 1 : 0;
        let lateApprovedBy = null;
        let lateApprovedAt = null;

        // Rule 1: Automatic OD precedence
        if (approvedODSet.has(rec.student_id)) {
          finalStatus = 'OD';
        }

        // Rule 2: 5-minute late rule enforcement with acceptable reason check
        if (finalStatus === 'PRESENT' && isLateWindowExceeded) {
          lateFlag = 1;
          if (lateReason && lateReasonAccepted) {
            // Student reported acceptable reason, faculty / mentor grants PRESENT
            finalStatus = 'PRESENT';
            lateApprovedBy = facultyId;
            lateApprovedAt = nowIso;
          } else {
            // No acceptable reason accepted: converted to ABSENT
            finalStatus = 'ABSENT';
            lateReason = lateReason || 'Exceeded 5-minute late arrival without acceptable justification';
            lateReasonAccepted = 0;
            lateEnforcedCount++;
          }
        } else if (lateFlag === 1 && lateReason && lateReasonAccepted) {
          finalStatus = 'PRESENT';
          lateApprovedBy = facultyId;
          lateApprovedAt = nowIso;
        }

        if (finalStatus === 'PRESENT') presentCount++;
        else if (finalStatus === 'ABSENT') absentCount++;
        else if (finalStatus === 'OD') odCount++;

        insertOrReplace.run(
          rec.student_id,
          subject_id,
          class_id,
          facultyId,
          date,
          period,
          finalStatus,
          lateFlag,
          lateReason,
          lateReasonAccepted,
          lateApprovedBy,
          lateApprovedAt,
          nowIso,
          nowIso
        );
      }

      // Record in Audit Log
      db.prepare(`
        INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'MARK_ATTENDANCE',
        'attendance',
        Number(class_id),
        req.user.id,
        req.user.name,
        req.user.role,
        null,
        JSON.stringify({ class_id, subject_id, date, period, total: records.length, present: presentCount, absent: absentCount, od: odCount, lateEnforced: lateEnforcedCount }),
        isLateWindowExceeded
          ? `Attendance submitted after ${lateAllowance}-minute window. ${lateEnforcedCount} students marked Absent due to late rule.`
          : 'Attendance marked within authorized class window.'
      );

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    let warningMessage = null;
    if (isLateWindowExceeded && lateEnforcedCount > 0) {
      warningMessage = `Attendance window closed. Elapsed time exceeds allowed ${lateAllowance} minutes. ${lateEnforcedCount} student(s) arrived late and were automatically recorded as ABSENT per college policy.`;
    }

    res.json({
      message: 'Attendance submitted and permanently saved to database',
      summary: {
        total: records.length,
        present: presentCount,
        absent: absentCount,
        od: odCount,
        lateEnforcedCount
      },
      warningMessage,
      isLateWindowExceeded
    });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ error: 'Failed to submit attendance' });
  }
});

// GET /api/attendance/student/:id
// Complete attendance statistics and history for a given student
router.get('/student/:id', authenticateToken, (req, res) => {
  const studentId = Number(req.params.id);

  if (req.user.role === 'STUDENT' && req.user.studentId !== studentId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const student = db.prepare(`
      SELECT s.id, s.register_no, u.name, u.email, d.name as department_name, c.room_no
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN classes c ON c.id = s.class_id
      WHERE s.id = ?
    `).get(studentId);

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Aggregate overall
    const overall = db.prepare(`
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'OD' THEN 1 ELSE 0 END) as od
      FROM attendance
      WHERE student_id = ?
    `).get(studentId);

    const total = overall.total_classes || 0;
    const present = overall.present || 0;
    const absent = overall.absent || 0;
    const od = overall.od || 0;
    const percentage = total > 0 ? (((present + od) / total) * 100).toFixed(1) : '100.0';

    // Subject breakdown
    const subjectWise = db.prepare(`
      SELECT 
        s.id as subject_id, s.code as subject_code, s.name as subject_name, s.credits,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as percentage
      FROM subjects s
      LEFT JOIN attendance a ON a.subject_id = s.id AND a.student_id = ?
      GROUP BY s.id
      HAVING total > 0
      ORDER BY s.code ASC
    `).all(studentId);

    // Detailed history
    const history = db.prepare(`
      SELECT a.id, a.date, a.period, a.status, a.late_flag, a.marked_at,
             s.code as subject_code, s.name as subject_name,
             u.name as faculty_name
      FROM attendance a
      JOIN subjects s ON s.id = a.subject_id
      JOIN faculty f ON f.id = a.faculty_id
      JOIN users u ON u.id = f.user_id
      WHERE a.student_id = ?
      ORDER BY a.date DESC, a.period DESC
    `).all(studentId);

    res.json({
      student,
      overall: {
        total,
        present,
        absent,
        od,
        percentage: Number(percentage)
      },
      subjectWise,
      history
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Failed to fetch student attendance' });
  }
});

// GET /api/attendance/college-summary (Admin dashboard)
router.get('/college-summary', authenticateToken, requireRoles('SUPER_ADMIN'), (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's attendance stats
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'OD' THEN 1 ELSE 0 END) as od
      FROM attendance
      WHERE date = ?
    `).get(today);

    // Overall college attendance stats
    const overallStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'OD' THEN 1 ELSE 0 END) as od
      FROM attendance
    `).get();

    const oTotal = overallStats.total || 0;
    const oPresent = overallStats.present || 0;
    const oOd = overallStats.od || 0;
    const overallPct = oTotal > 0 ? (((oPresent + oOd) / oTotal) * 100).toFixed(1) : '100.0';

    const tTotal = todayStats.total || 0;
    const tPresent = todayStats.present || 0;
    const tOd = todayStats.od || 0;
    const todayPct = tTotal > 0 ? (((tPresent + tOd) / tTotal) * 100).toFixed(1) : '100.0';

    // Department-wise attendance breakdown
    const deptAttendance = db.prepare(`
      SELECT 
        d.id, d.name, d.code,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as percentage
      FROM departments d
      JOIN classes c ON c.department_id = d.id
      LEFT JOIN attendance a ON a.class_id = c.id
      GROUP BY d.id
      ORDER BY d.id ASC
    `).all();

    // Low attendance student count (<75%)
    const minPct = Number(getSetting('minimum_attendance_percent', '75'));
    const lowAttCount = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT s.id,
          ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / COUNT(a.id)) * 100, 1) as pct
        FROM students s
        JOIN attendance a ON a.student_id = s.id
        GROUP BY s.id
        HAVING COUNT(a.id) >= 5 AND pct < ?
      )
    `).get(minPct).count;

    res.json({
      todayStats: {
        total: tTotal,
        present: tPresent,
        absent: todayStats.absent || 0,
        od: tOd,
        percentage: Number(todayPct)
      },
      overallStats: {
        total: oTotal,
        present: oPresent,
        absent: overallStats.absent || 0,
        od: oOd,
        percentage: Number(overallPct)
      },
      deptAttendance,
      lowAttendanceCount: lowAttCount
    });
  } catch (error) {
    console.error('Error fetching college attendance summary:', error);
    res.status(500).json({ error: 'Failed to fetch college summary' });
  }
});

// POST /api/attendance/report-late - Student reports reason for arriving late to staff in charge
router.post('/report-late', authenticateToken, (req, res) => {
  const { student_id, class_id, date, period, late_reason, faculty_id } = req.body;

  let resolvedStudentId = student_id;
  if (req.user.role === 'STUDENT') {
    resolvedStudentId = req.user.studentId || student_id;
    if (!resolvedStudentId) {
      const st = db.prepare(`SELECT id FROM students WHERE user_id = ?`).get(req.user.id);
      if (st) resolvedStudentId = st.id;
    }
  }

  if (!resolvedStudentId || !class_id || !date || !period || !late_reason) {
    return res.status(400).json({ error: 'Student ID, Class ID, date, period, and late reason are required' });
  }

  try {
    // Look up staff in charge of that period from timetable
    let inchargeFacultyId = faculty_id ? Number(faculty_id) : null;
    let subjectId = 1;

    const tt = db.prepare(`
      SELECT subject_id, faculty_id FROM timetable WHERE class_id = ? AND period_num = ?
    `).get(Number(class_id), Number(period));

    if (tt) {
      if (!inchargeFacultyId) inchargeFacultyId = tt.faculty_id;
      subjectId = tt.subject_id;
    }
    if (!inchargeFacultyId) inchargeFacultyId = 1;

    // Get incharge faculty details
    const fac = db.prepare(`
      SELECT u.name as faculty_name, f.faculty_code
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      WHERE f.id = ?
    `).get(inchargeFacultyId);

    const existing = db.prepare(`
      SELECT * FROM attendance WHERE student_id = ? AND class_id = ? AND date = ? AND period = ?
    `).get(Number(resolvedStudentId), Number(class_id), date, Number(period));

    if (existing) {
      db.prepare(`
        UPDATE attendance 
        SET late_flag = 1, late_reason = ?, faculty_id = COALESCE(?, faculty_id), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(late_reason.trim(), inchargeFacultyId, existing.id);
    } else {
      db.prepare(`
        INSERT INTO attendance (student_id, subject_id, class_id, faculty_id, date, period, status, late_flag, late_reason)
        VALUES (?, ?, ?, ?, ?, ?, 'ABSENT', 1, ?)
      `).run(
        Number(resolvedStudentId),
        subjectId,
        Number(class_id),
        inchargeFacultyId,
        date,
        Number(period),
        late_reason.trim()
      );
    }

    res.json({
      message: `Late arrival reason submitted to ${fac?.faculty_name || 'Staff In-Charge'} (${fac?.faculty_code || 'Faculty'}) for Period ${period} attendance review!`,
      incharge_faculty_name: fac?.faculty_name,
      incharge_faculty_code: fac?.faculty_code
    });
  } catch (err) {
    console.error('Error reporting late reason:', err);
    res.status(500).json({ error: 'Failed to report late reason' });
  }
});

// GET /api/attendance/student-late-reports - List student's submitted late reports
router.get('/student-late-reports', authenticateToken, (req, res) => {
  try {
    let studentId = req.user.studentId;
    if (req.user.role === 'STUDENT' && !studentId) {
      const st = db.prepare(`SELECT id FROM students WHERE user_id = ?`).get(req.user.id);
      if (st) studentId = st.id;
    } else if (req.query.student_id) {
      studentId = Number(req.query.student_id);
    }

    if (!studentId) {
      return res.json([]);
    }

    const reports = db.prepare(`
      SELECT a.id, a.date, a.period, a.status, a.late_flag, a.late_reason,
             a.late_reason_accepted, a.late_approved_at, a.marked_at,
             s.name as subject_name, s.code as subject_code,
             u.name as incharge_faculty_name, f.faculty_code as incharge_faculty_code,
             app_u.name as approved_by_name
      FROM attendance a
      JOIN subjects s ON s.id = a.subject_id
      JOIN faculty f ON f.id = a.faculty_id
      JOIN users u ON u.id = f.user_id
      LEFT JOIN faculty app_f ON app_f.id = a.late_approved_by
      LEFT JOIN users app_u ON app_u.id = app_f.user_id
      WHERE a.student_id = ? AND (a.late_flag = 1 OR a.late_reason IS NOT NULL)
      ORDER BY a.date DESC, a.period DESC
    `).all(studentId);

    res.json(reports);
  } catch (err) {
    console.error('Error fetching student late reports:', err);
    res.status(500).json({ error: 'Failed to fetch late reports' });
  }
});

// POST /api/attendance/approve-late - Period faculty or mentor verifies reason and grants PRESENT
router.post('/approve-late', authenticateToken, requireRoles('FACULTY', 'HOD', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { student_id, class_id, date, period, accepted, remarks } = req.body;

  if (!student_id || !class_id || !date || !period) {
    return res.status(400).json({ error: 'student_id, class_id, date, and period are required' });
  }

  try {
    const facultyId = req.user.facultyId || 1;
    const isAccepted = accepted === true || accepted === 1 || accepted === '1';

    const existing = db.prepare(`
      SELECT * FROM attendance WHERE student_id = ? AND class_id = ? AND date = ? AND period = ?
    `).get(Number(student_id), Number(class_id), date, Number(period));

    if (!existing) {
      return res.status(404).json({ error: 'Attendance record not found for this session' });
    }

    const newStatus = isAccepted ? 'PRESENT' : 'ABSENT';
    const reasonText = remarks || existing.late_reason || 'Verified by Faculty/Mentor';

    db.prepare(`
      UPDATE attendance
      SET status = ?,
          late_reason = ?,
          late_reason_accepted = ?,
          late_approved_by = ?,
          late_approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newStatus,
      reasonText,
      isAccepted ? 1 : 0,
      facultyId,
      existing.id
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, 'attendance', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'APPROVE_LATE_ATTENDANCE',
      existing.id,
      req.user.id,
      req.user.name,
      req.user.role,
      JSON.stringify({ status: existing.status, accepted: existing.late_reason_accepted }),
      JSON.stringify({ status: newStatus, accepted: isAccepted ? 1 : 0 }),
      isAccepted ? 'Accepted late arrival explanation and granted PRESENT' : 'Rejected late explanation, kept ABSENT'
    );

    res.json({
      message: isAccepted ? 'Late reason accepted. Student granted PRESENT!' : 'Late reason rejected. Marked ABSENT.',
      status: newStatus,
      late_reason_accepted: isAccepted ? 1 : 0
    });
  } catch (err) {
    console.error('Error approving late reason:', err);
    res.status(500).json({ error: 'Failed to process late attendance approval' });
  }
});

module.exports = router;
