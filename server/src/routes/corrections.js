const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/corrections - List correction requests
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT ac.*,
             s.register_no, u.name as student_name, u.email as student_email,
             d.name as department_name, d.code as department_code,
             sub.code as subject_code, sub.name as subject_name,
             fu.name as faculty_reviewer_name,
             hu.name as hod_reviewer_name
      FROM attendance_corrections ac
      JOIN students s ON s.id = ac.student_id
      JOIN users u ON u.id = s.user_id
      JOIN departments d ON d.id = s.department_id
      JOIN subjects sub ON sub.id = ac.subject_id
      LEFT JOIN faculty f ON f.id = ac.faculty_id
      LEFT JOIN users fu ON fu.id = f.user_id
      LEFT JOIN hods h ON h.id = ac.hod_id
      LEFT JOIN users hu ON hu.id = h.user_id
      WHERE 1=1
    `;

    const params = [];

    if (req.user.role === 'STUDENT') {
      query += ` AND ac.student_id = ?`;
      params.push(req.user.studentId);
    } else if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` AND s.department_id = ?`;
      params.push(req.user.departmentId);
    } else if (req.user.role === 'FACULTY' && req.user.facultyId) {
      query += ` AND ac.subject_id IN (SELECT subject_id FROM faculty_subjects WHERE faculty_id = ?)`;
      params.push(req.user.facultyId);
    }

    query += ` ORDER BY ac.date DESC, ac.created_at DESC`;

    const corrections = db.prepare(query).all(...params);
    res.json(corrections);
  } catch (error) {
    console.error('Error fetching corrections:', error);
    res.status(500).json({ error: 'Failed to fetch attendance corrections' });
  }
});

// POST /api/corrections - Student submits correction request
router.post('/', authenticateToken, requireRoles('STUDENT'), (req, res) => {
  const { date, subject_id, current_status, requested_status, reason, document_url, attendance_id } = req.body;
  const studentId = req.user.studentId;

  if (!date || !subject_id || !current_status || !requested_status || !reason) {
    return res.status(400).json({ error: 'Missing required correction fields' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO attendance_corrections (student_id, attendance_id, date, subject_id, current_status, requested_status, reason, document_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(studentId, attendance_id || null, date, subject_id, current_status, requested_status, reason.trim(), document_url || null);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Attendance correction request submitted' });
  } catch (error) {
    console.error('Error submitting correction:', error);
    res.status(500).json({ error: 'Failed to submit correction request' });
  }
});

// PUT /api/corrections/:id/verify - Faculty review
router.put('/:id/verify', authenticateToken, requireRoles('FACULTY', 'SUPER_ADMIN'), (req, res) => {
  const corrId = Number(req.params.id);
  const { decision, comments } = req.body;

  try {
    const corr = db.prepare(`SELECT * FROM attendance_corrections WHERE id = ?`).get(corrId);
    if (!corr) return res.status(404).json({ error: 'Correction request not found' });

    const newStatus = decision === 'APPROVE' ? 'FACULTY_APPROVED' : 'FACULTY_REJECTED';
    const facultyId = req.user.role === 'FACULTY' ? req.user.facultyId : 1;
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE attendance_corrections
      SET status = ?, faculty_id = ?, faculty_comment = ?, faculty_action_at = ?
      WHERE id = ?
    `).run(newStatus, facultyId, comments || null, nowIso, corrId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'FACULTY_VERIFY_CORRECTION',
      'attendance_corrections',
      corrId,
      req.user.id,
      req.user.name,
      req.user.role,
      JSON.stringify({ status: corr.status }),
      JSON.stringify({ status: newStatus, comments }),
      'Faculty reviewed attendance correction'
    );

    res.json({ message: 'Correction review submitted', status: newStatus });
  } catch (error) {
    console.error('Error verifying correction:', error);
    res.status(500).json({ error: 'Failed to process correction review' });
  }
});

// PUT /api/corrections/:id/approve - HOD approval & attendance update
router.put('/:id/approve', authenticateToken, requireRoles('HOD', 'SUPER_ADMIN'), (req, res) => {
  const corrId = Number(req.params.id);
  const { decision, comments } = req.body;

  try {
    const corr = db.prepare(`SELECT * FROM attendance_corrections WHERE id = ?`).get(corrId);
    if (!corr) return res.status(404).json({ error: 'Correction request not found' });

    const newStatus = decision === 'APPROVE' ? 'HOD_APPROVED' : 'HOD_REJECTED';
    const hodId = req.user.role === 'HOD' ? req.user.hodId : 1;
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE attendance_corrections
      SET status = ?, hod_id = ?, hod_comment = ?, hod_action_at = ?
      WHERE id = ?
    `).run(newStatus, hodId, comments || null, nowIso, corrId);

    // If APPROVED: Apply status change directly to attendance record!
    if (decision === 'APPROVE') {
      const updateStmt = db.prepare(`
        UPDATE attendance
        SET status = ?, updated_at = ?
        WHERE student_id = ? AND subject_id = ? AND date = ?
      `);
      updateStmt.run(corr.requested_status, nowIso, corr.student_id, corr.subject_id, corr.date);

      // Audit Log for attendance status change
      db.prepare(`
        INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'CORRECTION_APPLIED',
        'attendance',
        corr.attendance_id || 0,
        req.user.id,
        req.user.name,
        req.user.role,
        JSON.stringify({ old_status: corr.current_status }),
        JSON.stringify({ new_status: corr.requested_status }),
        `Approved correction request #${corrId}: ${corr.reason}`
      );
    }

    // Notify student
    const studentUser = db.prepare(`SELECT user_id FROM students WHERE id = ?`).get(corr.student_id);
    if (studentUser) {
      db.prepare(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`).run(
        studentUser.user_id,
        decision === 'APPROVE' ? 'Attendance Correction Approved' : 'Attendance Correction Declined',
        `Your correction request for ${corr.date} was ${decision === 'APPROVE' ? 'APPROVED and attendance updated.' : 'rejected by HOD.'}`,
        decision === 'APPROVE' ? 'SUCCESS' : 'ALERT',
        '/student/attendance'
      );
    }

    res.json({ message: `Correction request ${decision === 'APPROVE' ? 'approved and applied' : 'rejected'}`, status: newStatus });
  } catch (error) {
    console.error('Error approving correction:', error);
    res.status(500).json({ error: 'Failed to finalize correction' });
  }
});

module.exports = router;
