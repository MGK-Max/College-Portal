const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/faculty - List faculty
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT f.id, f.faculty_code, f.department_id, f.designation, f.phone,
             u.id as user_id, u.name, u.email, u.avatar_url,
             d.name as department_name, d.code as department_code
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      JOIN departments d ON d.id = f.department_id
    `;

    const params = [];
    if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` WHERE f.department_id = ?`;
      params.push(req.user.departmentId);
    } else if (req.query.department_id) {
      query += ` WHERE f.department_id = ?`;
      params.push(req.query.department_id);
    }

    query += ` ORDER BY u.name ASC`;

    const facultyList = db.prepare(query).all(...params);

    // Attach assigned subjects & classes to each faculty
    const getAssignments = db.prepare(`
      SELECT fs.id as assignment_id, s.id as subject_id, s.code as subject_code, s.name as subject_name,
             c.id as class_id, c.year_level, c.semester_num, c.room_no, sec.name as section_name
      FROM faculty_subjects fs
      JOIN subjects s ON s.id = fs.subject_id
      JOIN classes c ON c.id = fs.class_id
      JOIN sections sec ON sec.id = c.section_id
      WHERE fs.faculty_id = ?
    `);

    const result = facultyList.map(fac => ({
      ...fac,
      assignments: getAssignments.all(fac.id)
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// POST /api/faculty - Create new faculty (Admin only)
router.post('/', authenticateToken, requireRoles('SUPER_ADMIN'), (req, res) => {
  const { name, email, password, phone, department_id, designation, faculty_code } = req.body;

  if (!name || !email || !department_id || !designation || !faculty_code) {
    return res.status(400).json({ error: 'Name, email, department, designation, and faculty code are required' });
  }

  try {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password || 'password123', salt);

    const userRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, 'FACULTY', ?)
    `).run(name.trim(), email.trim().toLowerCase(), passwordHash, phone || null);

    const facRes = db.prepare(`
      INSERT INTO faculty (user_id, faculty_code, department_id, designation, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(userRes.lastInsertRowid, faculty_code.trim().toUpperCase(), department_id, designation.trim(), phone || null);

    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'CREATE_FACULTY',
      'faculty',
      Number(facRes.lastInsertRowid),
      req.user.id,
      req.user.name,
      req.user.role,
      null,
      JSON.stringify({ name, email, faculty_code, department_id, designation }),
      'Added new faculty member'
    );

    res.status(201).json({ id: facRes.lastInsertRowid, message: 'Faculty created successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email or Faculty Code already exists' });
    }
    console.error('Error creating faculty:', error);
    res.status(500).json({ error: 'Failed to create faculty' });
  }
});

// PUT /api/faculty/:id - Update faculty
router.put('/:id', authenticateToken, requireRoles('SUPER_ADMIN'), (req, res) => {
  const facId = Number(req.params.id);
  const { name, email, phone, department_id, designation, faculty_code } = req.body;

  try {
    const fac = db.prepare(`SELECT * FROM faculty WHERE id = ?`).get(facId);
    if (!fac) return res.status(404).json({ error: 'Faculty not found' });

    db.prepare(`
      UPDATE faculty 
      SET faculty_code = ?, department_id = ?, designation = ?, phone = ?
      WHERE id = ?
    `).run(faculty_code.trim().toUpperCase(), department_id, designation.trim(), phone || null, facId);

    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, phone = ?
      WHERE id = ?
    `).run(name.trim(), email.trim().toLowerCase(), phone || null, fac.user_id);

    res.json({ message: 'Faculty updated successfully' });
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ error: 'Failed to update faculty' });
  }
});

// DELETE /api/faculty/:id - Delete faculty
router.delete('/:id', authenticateToken, requireRoles('SUPER_ADMIN'), (req, res) => {
  const facId = Number(req.params.id);

  try {
    const fac = db.prepare(`SELECT user_id FROM faculty WHERE id = ?`).get(facId);
    if (!fac) return res.status(404).json({ error: 'Faculty not found' });

    db.prepare(`DELETE FROM users WHERE id = ?`).run(fac.user_id);

    res.json({ message: 'Faculty removed successfully' });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
});

// GET /api/faculty/dashboard-stats
router.get('/dashboard-stats', authenticateToken, requireRoles('FACULTY', 'SUPER_ADMIN', 'HOD'), (req, res) => {
  const facId = req.user.role === 'FACULTY' ? req.user.facultyId : Number(req.query.faculty_id || 1);

  if (!facId) {
    return res.status(400).json({ error: 'Faculty ID required' });
  }

  try {
    const faculty = db.prepare(`
      SELECT f.id, f.faculty_code, f.designation, u.name, u.email, d.name as department_name
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      JOIN departments d ON d.id = f.department_id
      WHERE f.id = ?
    `).get(facId);

    // Classes assigned
    const assignedClassesCount = db.prepare(`
      SELECT COUNT(DISTINCT class_id) as count FROM faculty_subjects WHERE faculty_id = ?
    `).get(facId).count;

    // Subjects assigned
    const assignedSubjectsCount = db.prepare(`
      SELECT COUNT(DISTINCT subject_id) as count FROM faculty_subjects WHERE faculty_id = ?
    `).get(facId).count;

    // Total attendance sessions marked
    const sessionsMarked = db.prepare(`
      SELECT COUNT(DISTINCT date || '-' || period || '-' || class_id) as count
      FROM attendance
      WHERE faculty_id = ?
    `).get(facId).count;

    // Pending OD requests awaiting faculty verification from enrolled classes
    const pendingODVerifications = db.prepare(`
      SELECT COUNT(DISTINCT o.id) as count
      FROM od_requests o
      JOIN students s ON s.id = o.student_id
      JOIN faculty_subjects fs ON fs.class_id = s.class_id
      WHERE fs.faculty_id = ? AND o.status = 'PENDING'
    `).get(facId).count;

    res.json({
      faculty,
      assignedClassesCount,
      assignedSubjectsCount,
      sessionsMarked,
      pendingODVerifications
    });
  } catch (error) {
    console.error('Error fetching faculty dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch faculty stats' });
  }
});

module.exports = router;
