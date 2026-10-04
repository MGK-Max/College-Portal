const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/od - List OD requests with role-based visibility
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT o.*,
             s.register_no, u.name as student_name, u.email as student_email,
             d.name as department_name, d.code as department_code,
             c.year_level, sec.name as section_name,
             fu.name as faculty_reviewer_name,
             hu.name as hod_reviewer_name
      FROM od_requests o
      JOIN students s ON s.id = o.student_id
      JOIN users u ON u.id = s.user_id
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN classes c ON c.id = s.class_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      LEFT JOIN faculty f ON f.id = o.faculty_id
      LEFT JOIN users fu ON fu.id = f.user_id
      LEFT JOIN hods h ON h.id = o.hod_id
      LEFT JOIN users hu ON hu.id = h.user_id
      WHERE 1=1
    `;

    const params = [];

    if (req.user.role === 'STUDENT') {
      query += ` AND o.student_id = ?`;
      params.push(req.user.studentId);
    } else if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` AND s.department_id = ?`;
      params.push(req.user.departmentId);
    } else if (req.user.role === 'FACULTY' && req.user.facultyId) {
      query += ` AND s.class_id IN (SELECT class_id FROM faculty_subjects WHERE faculty_id = ?)`;
      params.push(req.user.facultyId);
    }

    if (req.query.status) {
      query += ` AND o.status = ?`;
      params.push(req.query.status);
    }

    query += ` ORDER BY o.date DESC, o.created_at DESC`;

    const odList = db.prepare(query).all(...params);
    res.json(odList);
  } catch (error) {
    console.error('Error fetching OD requests:', error);
    res.status(500).json({ error: 'Failed to fetch OD requests' });
  }
});

// POST /api/od - Student applies for On-Duty
router.post('/', authenticateToken, requireRoles('STUDENT'), (req, res) => {
  const { event_name, reason, location, description, date, from_time, to_time, document_url } = req.body;
  const studentId = req.user.studentId;

  if (!event_name || !reason || !location || !date || !from_time || !to_time) {
    return res.status(400).json({ error: 'Event name, reason, location, date, and timings are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO od_requests (student_id, event_name, reason, location, description, date, from_time, to_time, document_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(studentId, event_name.trim(), reason.trim(), location.trim(), description || null, date, from_time, to_time, document_url || null);

    // Notify assigned faculty
    const student = db.prepare(`SELECT class_id, department_id FROM students WHERE id = ?`).get(studentId);
    if (student && student.class_id) {
      const assignedFaculty = db.prepare(`
        SELECT f.user_id FROM faculty_subjects fs
        JOIN faculty f ON f.id = fs.faculty_id
        WHERE fs.class_id = ?
      `).all(student.class_id);

      const notifStmt = db.prepare(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`);
      assignedFaculty.forEach(fac => {
        notifStmt.run(
          fac.user_id,
          'New OD Verification Request',
          `${req.user.name} submitted an On-Duty request for "${event_name}".`,
          'INFO',
          '/faculty/od-verify'
        );
      });
    }

    res.status(201).json({ id: result.lastInsertRowid, message: 'On-Duty application submitted successfully' });
  } catch (error) {
    console.error('Error applying for OD:', error);
    res.status(500).json({ error: 'Failed to apply for On-Duty' });
  }
});

// PUT /api/od/:id/verify - Faculty Verification Step
router.put('/:id/verify', authenticateToken, requireRoles('FACULTY', 'SUPER_ADMIN'), (req, res) => {
  const odId = Number(req.params.id);
  const { decision, comments } = req.body; // decision: 'APPROVE' or 'REJECT'

  if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
    return res.status(400).json({ error: 'Valid decision (APPROVE or REJECT) required' });
  }

  try {
    const od = db.prepare(`SELECT * FROM od_requests WHERE id = ?`).get(odId);
    if (!od) return res.status(404).json({ error: 'OD request not found' });

    const newStatus = decision === 'APPROVE' ? 'FACULTY_APPROVED' : 'FACULTY_REJECTED';
    const facultyId = req.user.role === 'FACULTY' ? req.user.facultyId : 1;
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE od_requests
      SET status = ?, faculty_id = ?, faculty_comment = ?, faculty_action_at = ?
      WHERE id = ?
    `).run(newStatus, facultyId, comments || null, nowIso, odId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'FACULTY_VERIFY_OD',
      'od_requests',
      odId,
      req.user.id,
      req.user.name,
      req.user.role,
      JSON.stringify({ status: od.status }),
      JSON.stringify({ status: newStatus, comments }),
      'Faculty verified OD request'
    );

    // Notify student
    const studentUser = db.prepare(`SELECT user_id FROM students WHERE id = ?`).get(od.student_id);
    if (studentUser) {
      db.prepare(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`).run(
        studentUser.user_id,
        decision === 'APPROVE' ? 'OD Verified by Faculty' : 'OD Rejected by Faculty',
        `Your OD request for "${od.event_name}" was ${decision === 'APPROVE' ? 'verified and sent to HOD' : 'rejected'}.`,
        decision === 'APPROVE' ? 'INFO' : 'ALERT',
        '/student/od'
      );
    }

    res.json({ message: `OD request ${decision === 'APPROVE' ? 'verified' : 'rejected'} successfully`, status: newStatus });
  } catch (error) {
    console.error('Error verifying OD:', error);
    res.status(500).json({ error: 'Failed to verify OD request' });
  }
});

// PUT /api/od/:id/approve - HOD Final Approval Step
router.put('/:id/approve', authenticateToken, requireRoles('HOD', 'SUPER_ADMIN'), (req, res) => {
  const odId = Number(req.params.id);
  const { decision, comments } = req.body; // decision: 'APPROVE' or 'REJECT'

  if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
    return res.status(400).json({ error: 'Valid decision (APPROVE or REJECT) required' });
  }

  try {
    const od = db.prepare(`SELECT * FROM od_requests WHERE id = ?`).get(odId);
    if (!od) return res.status(404).json({ error: 'OD request not found' });

    const newStatus = decision === 'APPROVE' ? 'HOD_APPROVED' : 'HOD_REJECTED';
    const hodId = req.user.role === 'HOD' ? req.user.hodId : 1;
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE od_requests
      SET status = ?, hod_id = ?, hod_comment = ?, hod_action_at = ?
      WHERE id = ?
    `).run(newStatus, hodId, comments || null, nowIso, odId);

    // If HOD APPROVED: Automatically update any matching attendance for this student and date to 'OD'!
    if (decision === 'APPROVE') {
      const updateAttendance = db.prepare(`
        UPDATE attendance
        SET status = 'OD', updated_at = ?
        WHERE student_id = ? AND date = ?
      `);
      updateAttendance.run(nowIso, od.student_id, od.date);
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'HOD_APPROVAL_OD',
      'od_requests',
      odId,
      req.user.id,
      req.user.name,
      req.user.role,
      JSON.stringify({ status: od.status }),
      JSON.stringify({ status: newStatus, comments }),
      'HOD final action on OD request'
    );

    // Notify student
    const studentUser = db.prepare(`SELECT user_id FROM students WHERE id = ?`).get(od.student_id);
    if (studentUser) {
      db.prepare(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`).run(
        studentUser.user_id,
        decision === 'APPROVE' ? 'OD Request Officially Approved!' : 'OD Request Declined by HOD',
        `Your On-Duty request for "${od.event_name}" has been ${decision === 'APPROVE' ? 'fully APPROVED. Attendance credit updated.' : 'rejected by HOD'}.`,
        decision === 'APPROVE' ? 'SUCCESS' : 'ALERT',
        '/student/od'
      );
    }

    res.json({ message: `OD request ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully`, status: newStatus });
  } catch (error) {
    console.error('Error in HOD approval for OD:', error);
    res.status(500).json({ error: 'Failed to process OD request' });
  }
});

module.exports = router;
