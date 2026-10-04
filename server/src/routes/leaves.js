const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/leaves - List leaves (my leaves or department leaves depending on role)
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT lr.*, u.avatar_url, d.name as department_name, d.code as department_code
      FROM leave_requests lr
      JOIN users u ON u.id = lr.user_id
      LEFT JOIN departments d ON d.id = lr.department_id
    `;
    const params = [];

    if (req.query.scope === 'my') {
      query += ` WHERE lr.user_id = ?`;
      params.push(req.user.id);
    } else if (req.user.role === 'HOD') {
      // HOD sees department leaves
      query += ` WHERE lr.department_id = ? OR lr.user_id = ?`;
      params.push(req.user.departmentId, req.user.id);
    } else if (req.user.role === 'FACULTY') {
      // Faculty sees their students' leaves & their own
      query += ` WHERE lr.user_id = ? OR (lr.user_role = 'STUDENT' AND lr.department_id = ?)`;
      params.push(req.user.id, req.user.departmentId);
    } else if (req.user.role === 'STUDENT') {
      query += ` WHERE lr.user_id = ?`;
      params.push(req.user.id);
    }
    // DEAN and ADMINISTRATOR see all

    query += ` ORDER BY lr.from_date DESC, lr.created_at DESC`;
    const leaves = db.prepare(query).all(...params);
    res.json({ leaves });
  } catch (err) {
    console.error('Error fetching leaves:', err);
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// POST /api/leaves - Submit a leave request (Student, Faculty, HOD, Dean)
router.post('/', authenticateToken, (req, res) => {
  const { leave_type, from_date, to_date, reason } = req.body;

  if (!leave_type || !from_date || !to_date || !reason) {
    return res.status(400).json({ error: 'Leave type, start date, end date, and reason are required' });
  }

  try {
    const deptId = req.user.departmentId || null;
    let autoApprover = 'System Verified';
    if (req.user.role === 'STUDENT') autoApprover = 'Faculty Mentor';
    else if (req.user.role === 'FACULTY') autoApprover = 'Department HOD';
    else if (req.user.role === 'HOD') autoApprover = 'Dean of Cluster';
    else if (req.user.role === 'DEAN') autoApprover = 'Administrator';

    const stmt = db.prepare(`
      INSERT INTO leave_requests (user_id, user_name, user_role, department_id, leave_type, from_date, to_date, reason, status, approved_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?)
    `);

    const result = stmt.run(
      req.user.id,
      req.user.name,
      req.user.role,
      deptId,
      leave_type,
      from_date,
      to_date,
      reason,
      autoApprover
    );

    res.status(201).json({
      message: 'Leave request recorded and approved successfully',
      leaveId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating leave request:', err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

module.exports = router;
