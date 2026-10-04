const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/hackathons - List all hackathons (or filtered by student/department)
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT h.*, s.register_no, u.name as student_name, d.name as department_name, d.code as department_code,
        uf.name as recorded_by_faculty
      FROM hackathons h
      JOIN students s ON s.id = h.student_id
      JOIN users u ON u.id = s.user_id
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN faculty f ON f.id = h.faculty_id
      LEFT JOIN users uf ON uf.id = f.user_id
    `;
    const params = [];

    if (req.user.role === 'STUDENT') {
      query += ` WHERE h.student_id = ?`;
      params.push(req.user.studentId);
    } else if (req.user.role === 'FACULTY' || req.user.role === 'HOD') {
      query += ` WHERE s.department_id = ?`;
      params.push(req.user.departmentId);
    }

    query += ` ORDER BY h.event_date DESC`;
    const hackathons = db.prepare(query).all(...params);
    res.json({ hackathons });
  } catch (err) {
    console.error('Error fetching hackathons:', err);
    res.status(500).json({ error: 'Failed to fetch hackathons' });
  }
});

// POST /api/hackathons - Record a student hackathon achievement (Faculty, HOD, Admin)
router.post('/', authenticateToken, requireRoles('FACULTY', 'HOD', 'DEAN', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { student_id, event_name, organizer, project_title, achievement, cash_prize, event_date, certificate_url } = req.body;

  if (!student_id || !event_name || !organizer || !project_title || !achievement || !event_date) {
    return res.status(400).json({ error: 'Student ID, event name, organizer, project title, achievement, and date are required' });
  }

  try {
    const student = db.prepare(`SELECT id, user_id FROM students WHERE id = ?`).get(Number(student_id));
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const facultyId = req.user.facultyId || null;

    const stmt = db.prepare(`
      INSERT INTO hackathons (student_id, faculty_id, event_name, organizer, project_title, achievement, cash_prize, event_date, certificate_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      Number(student_id),
      facultyId,
      event_name,
      organizer,
      project_title,
      achievement,
      cash_prize || '',
      event_date,
      certificate_url || ''
    );

    // Notify student
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, 'SUCCESS')
    `).run(
      student.user_id,
      '🎉 Hackathon Achievement Recorded',
      `Your participation/award in ${event_name} (${achievement}) has been officially verified and added to your collegiate profile.`
    );

    res.status(201).json({
      message: 'Hackathon record created successfully',
      hackathonId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating hackathon record:', err);
    res.status(500).json({ error: 'Failed to record hackathon' });
  }
});

module.exports = router;
