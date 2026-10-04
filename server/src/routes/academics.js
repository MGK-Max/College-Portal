const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/academics/academic-years
router.get('/academic-years', authenticateToken, (req, res) => {
  try {
    const years = db.prepare(`SELECT * FROM academic_years ORDER BY year_label DESC`).all();
    res.json(years);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch academic years' });
  }
});

// GET /api/academics/sections
router.get('/sections', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT sec.*, d.name as department_name, d.code as department_code
      FROM sections sec
      JOIN departments d ON d.id = sec.department_id
    `;
    const params = [];
    if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` WHERE sec.department_id = ?`;
      params.push(req.user.departmentId);
    } else if (req.query.department_id) {
      query += ` WHERE sec.department_id = ?`;
      params.push(req.query.department_id);
    }
    query += ` ORDER BY sec.department_id, sec.year_level, sec.name`;
    const sections = db.prepare(query).all(...params);
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// GET /api/academics/classes
router.get('/classes', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT c.*, d.name as department_name, d.code as department_code, sec.name as section_name,
        (SELECT COUNT(*) FROM student_classes sc WHERE sc.class_id = c.id) as student_count
      FROM classes c
      JOIN departments d ON d.id = c.department_id
      JOIN sections sec ON sec.id = c.section_id
    `;
    const params = [];
    if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` WHERE c.department_id = ?`;
      params.push(req.user.departmentId);
    } else if (req.query.department_id) {
      query += ` WHERE c.department_id = ?`;
      params.push(req.query.department_id);
    }
    query += ` ORDER BY c.department_id, c.year_level, c.semester_num`;
    const classes = db.prepare(query).all(...params);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST /api/academics/classes (Admin & HOD)
router.post('/classes', authenticateToken, requireRoles('SUPER_ADMIN', 'ADMINISTRATOR', 'HOD'), (req, res) => {
  const { department_id, year_level, semester_num, section_id, room_no, academic_year, mentor1_id, mentor2_id } = req.body;
  if (!department_id || !year_level || !semester_num || !section_id || !room_no) {
    return res.status(400).json({ error: 'Missing required class fields' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO classes (department_id, year_level, semester_num, section_id, room_no, academic_year, mentor1_id, mentor2_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      department_id,
      year_level,
      semester_num,
      section_id,
      room_no.trim(),
      academic_year || '2026-2027',
      mentor1_id ? Number(mentor1_id) : null,
      mentor2_id ? Number(mentor2_id) : null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Class created successfully' });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// POST /api/academics/sections (Administrator, Super Admin, HOD - Add Section)
router.post('/sections', authenticateToken, requireRoles('SUPER_ADMIN', 'ADMINISTRATOR', 'HOD'), (req, res) => {
  const { name, department_id, year_level, semester_num, room_no, academic_year, mentor1_id, mentor2_id } = req.body;
  if (!name || !department_id || !year_level) {
    return res.status(400).json({ error: 'Section name, department_id and year_level are required' });
  }

  const deptId = Number(department_id);
  const yearLevel = Number(year_level);
  const semNum = Number(semester_num || yearLevel * 2);
  const cleanName = name.trim();
  const acadYear = academic_year || '2026-2027';

  try {
    // 1. Check or insert into sections
    let sec = db.prepare(`SELECT id FROM sections WHERE department_id = ? AND year_level = ? AND name = ?`).get(deptId, yearLevel, cleanName);
    let sectionId;
    if (!sec) {
      const secRes = db.prepare(`INSERT INTO sections (name, department_id, year_level, semester_num) VALUES (?, ?, ?, ?)`).run(cleanName, deptId, yearLevel, semNum);
      sectionId = Number(secRes.lastInsertRowid);
    } else {
      sectionId = sec.id;
    }

    // 2. Insert class entry with room and mentors
    const defaultRoom = (room_no && room_no.trim()) ? room_no.trim() : `Room ${deptId}${yearLevel}01`;
    const m1 = mentor1_id ? Number(mentor1_id) : null;
    const m2 = mentor2_id ? Number(mentor2_id) : null;

    const clsRes = db.prepare(`
      INSERT INTO classes (department_id, year_level, semester_num, section_id, room_no, academic_year, mentor1_id, mentor2_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(deptId, yearLevel, semNum, sectionId, defaultRoom, acadYear, m1, m2);

    res.status(201).json({
      message: 'Class section created successfully',
      section_id: sectionId,
      class_id: Number(clsRes.lastInsertRowid)
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ error: 'Failed to create class section' });
  }
});

// GET /api/academics/subjects
router.get('/subjects', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT s.*, d.name as department_name, d.code as department_code
      FROM subjects s
      JOIN departments d ON d.id = s.department_id
    `;
    const params = [];
    if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` WHERE s.department_id = ?`;
      params.push(req.user.departmentId);
    } else if (req.query.department_id) {
      query += ` WHERE s.department_id = ?`;
      params.push(req.query.department_id);
    }
    query += ` ORDER BY s.department_id, s.year_level, s.semester_num, s.code`;
    const subjects = db.prepare(query).all(...params);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// POST /api/academics/subjects (Admin only)
router.post('/subjects', authenticateToken, requireRoles('SUPER_ADMIN'), (req, res) => {
  const { code, name, department_id, year_level, semester_num, credits } = req.body;
  if (!code || !name || !department_id || !year_level || !semester_num) {
    return res.status(400).json({ error: 'Missing required subject fields' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO subjects (code, name, department_id, year_level, semester_num, credits)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(code.trim().toUpperCase(), name.trim(), department_id, year_level, semester_num, credits || 3);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Subject created successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Subject code already exists' });
    }
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// GET /api/academics/faculty-subjects
router.get('/faculty-subjects', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT fs.id, fs.faculty_id, fs.subject_id, fs.class_id,
             u.name as faculty_name, f.faculty_code,
             s.code as subject_code, s.name as subject_name,
             c.year_level, c.semester_num, c.room_no, sec.name as section_name,
             d.name as department_name
      FROM faculty_subjects fs
      JOIN faculty f ON f.id = fs.faculty_id
      JOIN users u ON u.id = f.user_id
      JOIN subjects s ON s.id = fs.subject_id
      JOIN classes c ON c.id = fs.class_id
      JOIN sections sec ON sec.id = c.section_id
      JOIN departments d ON d.id = c.department_id
    `;
    const params = [];
    if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` WHERE d.id = ?`;
      params.push(req.user.departmentId);
    } else if (req.user.role === 'FACULTY' && req.user.facultyId) {
      query += ` WHERE fs.faculty_id = ?`;
      params.push(req.user.facultyId);
    }
    query += ` ORDER BY d.id, c.year_level, s.name`;
    const mappings = db.prepare(query).all(...params);
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch faculty subject assignments' });
  }
});

// POST /api/academics/assign-faculty-subject (Admin or HOD)
router.post('/assign-faculty-subject', authenticateToken, requireRoles('SUPER_ADMIN', 'HOD'), (req, res) => {
  const { faculty_id, subject_id, class_id } = req.body;
  if (!faculty_id || !subject_id || !class_id) {
    return res.status(400).json({ error: 'faculty_id, subject_id, and class_id are required' });
  }

  try {
    // If HOD, verify faculty and class belong to their department
    if (req.user.role === 'HOD') {
      const fac = db.prepare(`SELECT department_id FROM faculty WHERE id = ?`).get(faculty_id);
      const cls = db.prepare(`SELECT department_id FROM classes WHERE id = ?`).get(class_id);
      if (!fac || fac.department_id !== req.user.departmentId || !cls || cls.department_id !== req.user.departmentId) {
        return res.status(403).json({ error: 'HOD can only assign within their own department' });
      }
    }

    const result = db.prepare(`
      INSERT OR REPLACE INTO faculty_subjects (faculty_id, subject_id, class_id)
      VALUES (?, ?, ?)
    `).run(faculty_id, subject_id, class_id);

    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'ASSIGN_FACULTY_SUBJECT',
      'faculty_subjects',
      Number(result.lastInsertRowid),
      req.user.id,
      req.user.name,
      req.user.role,
      null,
      JSON.stringify({ faculty_id, subject_id, class_id }),
      'Assigned faculty to subject and class'
    );

    res.status(201).json({ message: 'Subject assigned to faculty successfully' });
  } catch (error) {
    console.error('Error assigning subject to faculty:', error);
    res.status(500).json({ error: 'Failed to assign subject to faculty' });
  }
});

module.exports = router;
