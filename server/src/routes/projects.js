const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/projects - List projects (filtered by department or all for Admin/Dean)
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT p.*, d.name as department_name, d.code as department_code, d.category as department_category,
        u.name as guide_name, f.faculty_code as guide_code
      FROM projects p
      JOIN departments d ON d.id = p.department_id
      LEFT JOIN faculty f ON f.id = p.faculty_guide_id
      LEFT JOIN users u ON u.id = f.user_id
    `;
    const params = [];

    if (req.user.role === 'HOD' || req.user.role === 'FACULTY') {
      const deptId = req.query.department_id ? Number(req.query.department_id) : (req.user.departmentId || req.user.department_id || 1);
      query += ` WHERE p.department_id = ?`;
      params.push(deptId);
    } else if (req.user.role === 'STUDENT') {
      const st = db.prepare(`SELECT department_id FROM students WHERE user_id = ? OR id = ?`).get(req.user.id, req.user.studentId || 0);
      const sDept = st ? st.department_id : (req.user.departmentId || 1);
      query += ` WHERE p.department_id = ?`;
      params.push(sDept);
    } else if (req.query.department_id) {
      query += ` WHERE p.department_id = ?`;
      params.push(Number(req.query.department_id));
    }

    query += ` ORDER BY p.created_at DESC`;
    const projects = db.prepare(query).all(...params);
    res.json({ projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - Add a new project (Student can post in their project tab, Faculty, HOD, Admin, Dean)
router.post('/', authenticateToken, requireRoles('HOD', 'FACULTY', 'DEAN', 'ADMINISTRATOR', 'SUPER_ADMIN', 'STUDENT'), (req, res) => {
  const { title, category, year_level, faculty_guide_id, student_team, github_url, description, department_id } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }

  let deptId = Number(department_id || 1);
  let resolvedYearLevel = Number(year_level || 2);
  let resolvedTeam = student_team ? student_team.trim() : req.user.name;

  if (req.user.role === 'STUDENT') {
    const st = db.prepare(`SELECT department_id, year_level FROM students WHERE user_id = ? OR id = ?`).get(req.user.id, req.user.studentId || 0);
    if (st) {
      deptId = st.department_id;
      if (!year_level) resolvedYearLevel = st.year_level;
    }
  } else if (req.user.role === 'HOD' || req.user.role === 'FACULTY') {
    deptId = req.user.departmentId || req.user.department_id || 1;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO projects (department_id, title, category, year_level, faculty_guide_id, student_team, github_url, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS')
    `);

    const result = stmt.run(
      deptId,
      title.trim(),
      category,
      resolvedYearLevel,
      faculty_guide_id ? Number(faculty_guide_id) : null,
      resolvedTeam,
      github_url || '',
      description || ''
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, reason)
      VALUES (?, 'projects', ?, ?, ?, ?, ?)
    `).run('ADD_PROJECT', result.lastInsertRowid, req.user.id, req.user.name, req.user.role, `Added project: ${title}`);

    res.status(201).json({
      message: 'Project created successfully',
      projectId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id/status - Update project status
router.put('/:id/status', authenticateToken, requireRoles('HOD', 'FACULTY', 'DEAN', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { status } = req.body;
  if (!['PROPOSED', 'IN_PROGRESS', 'REVIEW_PENDING', 'COMPLETED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid project status' });
  }

  try {
    db.prepare(`UPDATE projects SET status = ? WHERE id = ?`).run(status, req.params.id);
    res.json({ message: 'Project status updated successfully' });
  } catch (err) {
    console.error('Error updating project status:', err);
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

module.exports = router;
