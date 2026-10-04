const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.prepare(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`).get(email.trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Role-specific payload details
    let roleMeta = {};
    if (user.role === 'HOD') {
      const hod = db.prepare(`
        SELECT h.id as hod_id, h.department_id, d.name as department_name, d.code as department_code
        FROM hods h
        JOIN departments d ON d.id = h.department_id
        WHERE h.user_id = ?
      `).get(user.id);
      if (hod) roleMeta = hod;
    } else if (user.role === 'FACULTY') {
      const fac = db.prepare(`
        SELECT f.id as faculty_id, f.faculty_code, f.department_id, f.designation, d.name as department_name
        FROM faculty f
        JOIN departments d ON d.id = f.department_id
        WHERE f.user_id = ?
      `).get(user.id);
      if (fac) roleMeta = fac;
    } else if (user.role === 'STUDENT') {
      const stu = db.prepare(`
        SELECT s.id as student_id, s.register_no, s.department_id, s.year_level, s.semester_num, s.section_id, s.class_id,
               d.name as department_name, sec.name as section_name, c.room_no
        FROM students s
        JOIN departments d ON d.id = s.department_id
        LEFT JOIN sections sec ON sec.id = s.section_id
        LEFT JOIN classes c ON c.id = s.class_id
        WHERE s.user_id = ?
      `).get(user.id);
      if (stu) roleMeta = stu;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Fetch system settings
    const settingsRows = db.prepare(`SELECT setting_key, setting_value FROM attendance_settings`).all();
    const settings = {};
    settingsRows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url,
        ...roleMeta
      },
      settings
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    let roleMeta = {};
    const userId = req.user.id;

    if (req.user.role === 'HOD') {
      const hod = db.prepare(`
        SELECT h.id as hod_id, h.department_id, d.name as department_name, d.code as department_code
        FROM hods h
        JOIN departments d ON d.id = h.department_id
        WHERE h.user_id = ?
      `).get(userId);
      if (hod) roleMeta = hod;
    } else if (req.user.role === 'FACULTY') {
      const fac = db.prepare(`
        SELECT f.id as faculty_id, f.faculty_code, f.department_id, f.designation, d.name as department_name
        FROM faculty f
        JOIN departments d ON d.id = f.department_id
        WHERE f.user_id = ?
      `).get(userId);
      if (fac) roleMeta = fac;
    } else if (req.user.role === 'STUDENT') {
      const stu = db.prepare(`
        SELECT s.id as student_id, s.register_no, s.department_id, s.year_level, s.semester_num, s.section_id, s.class_id,
               d.name as department_name, sec.name as section_name, c.room_no
        FROM students s
        JOIN departments d ON d.id = s.department_id
        LEFT JOIN sections sec ON sec.id = s.section_id
        LEFT JOIN classes c ON c.id = s.class_id
        WHERE s.user_id = ?
      `).get(userId);
      if (stu) roleMeta = stu;
    }

    const settingsRows = db.prepare(`SELECT setting_key, setting_value FROM attendance_settings`).all();
    const settings = {};
    settingsRows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    res.json({
      user: {
        ...req.user,
        ...roleMeta
      },
      settings
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/auth/demo-accounts (convenience helper for testing)
router.get('/demo-accounts', (req, res) => {
  try {
    const depts = db.prepare(`
      SELECT d.id, d.name, d.code, d.category,
        h.id as hod_id, u.name as hod_name, u.email as hod_email,
        (SELECT COUNT(*) FROM faculty f WHERE f.department_id = d.id) as faculty_count
      FROM departments d
      LEFT JOIN hods h ON h.department_id = d.id
      LEFT JOIN users u ON u.id = h.user_id
      ORDER BY d.id ASC
    `).all();

    const facultyByDept = {};
    const allFaculty = db.prepare(`
      SELECT f.id, f.faculty_code, f.designation, f.cabin_room, f.department_id,
        u.name, u.email
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      ORDER BY f.department_id, f.id
    `).all();

    allFaculty.forEach(fac => {
      if (!facultyByDept[fac.department_id]) {
        facultyByDept[fac.department_id] = [];
      }
      facultyByDept[fac.department_id].push(fac);
    });

    res.json({
      accounts: [
        {
          role: 'SUPER_ADMIN',
          label: 'Administrator',
          email: 'admin@college.edu',
          name: 'Dr. Alexander Bennett',
          description: 'Full College Access & System Settings'
        },
        {
          role: 'DEAN',
          label: 'Dean of Computing Cluster',
          email: 'dean@college.edu',
          name: 'Dr. K. R. Shanmugam',
          description: 'Cluster Head • Computer Science Cluster'
        },
        {
          role: 'HOD',
          label: 'Department',
          email: 'hod.ad@college.edu',
          name: '14 College Departments',
          description: 'Browse all 14 autonomous engineering departments'
        },
        {
          role: 'FACULTY',
          label: 'Faculty',
          email: 'faculty@college.edu',
          name: 'Faculty in 14 Departments',
          description: 'Browse departments and authenticate as any faculty'
        },
        {
          role: 'STUDENT',
          label: 'Student Portal',
          email: 'student@college.edu',
          name: 'Arun Kumar (AD301)',
          description: 'II Year AI & DS - Views Attendance & Applies OD'
        }
      ],
      departments: depts,
      facultyByDept,
      defaultPassword: 'password123'
    });
  } catch (err) {
    console.error('Error fetching demo accounts:', err);
    res.status(500).json({ error: 'Failed to fetch demo accounts' });
  }
});

module.exports = router;
