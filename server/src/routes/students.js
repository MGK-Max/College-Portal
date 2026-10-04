const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/students - List students with filtering
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT s.id, s.register_no, s.department_id, s.year_level, s.semester_num, s.section_id, s.class_id,
             s.academic_year, s.admission_year, s.photo_url,
             u.id as user_id, u.name, u.email, u.phone,
             d.name as department_name, d.code as department_code,
             sec.name as section_name, c.room_no
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      LEFT JOIN classes c ON c.id = s.class_id
      WHERE 1=1
    `;

    const params = [];

    // Role-based scoping
    if (req.user.role === 'STUDENT') {
      query += ` AND s.user_id = ?`;
      params.push(req.user.id);
    } else if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` AND s.department_id = ?`;
      params.push(req.user.departmentId);
    } else if (req.user.role === 'FACULTY' && req.user.departmentId) {
      if (req.query.scope === 'teaching' && req.user.facultyId) {
        query += ` AND s.class_id IN (SELECT class_id FROM faculty_subjects WHERE faculty_id = ?)`;
        params.push(req.user.facultyId);
      } else {
        query += ` AND s.department_id = ?`;
        params.push(req.user.departmentId);
      }
    } else if (req.query.department_id) {
      query += ` AND s.department_id = ?`;
      params.push(req.query.department_id);
    }

    if (req.query.class_id) {
      query += ` AND s.class_id = ?`;
      params.push(req.query.class_id);
    }

    if (req.query.year_level) {
      query += ` AND s.year_level = ?`;
      params.push(req.query.year_level);
    }

    if (req.query.search) {
      query += ` AND (u.name LIKE ? OR s.register_no LIKE ? OR u.email LIKE ?)`;
      const term = `%${req.query.search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY s.register_no ASC`;

    const students = db.prepare(query).all(...params);

    // Calculate quick attendance percentage for each student
    const getAtt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('PRESENT', 'OD') THEN 1 ELSE 0 END) as attended
      FROM attendance
      WHERE student_id = ?
    `);

    const result = students.map(st => {
      const att = getAtt.get(st.id);
      const total = att.total || 0;
      const attended = att.attended || 0;
      const pct = total > 0 ? ((attended / total) * 100).toFixed(1) : '100.0';
      return {
        ...st,
        totalClasses: total,
        attendedClasses: attended,
        attendancePercentage: Number(pct)
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/me/dashboard-stats - Student's personalized dashboard
router.get('/me/dashboard-stats', authenticateToken, requireRoles('STUDENT'), (req, res) => {
  const studentId = req.user.studentId;

  if (!studentId) {
    return res.status(400).json({ error: 'Student record not linked' });
  }

  try {
    // 1. Student Profile
    const student = db.prepare(`
      SELECT s.*, u.name, u.email, u.phone, u.avatar_url,
             d.name as department_name, d.code as department_code,
             sec.name as section_name, c.room_no
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      LEFT JOIN classes c ON c.id = s.class_id
      WHERE s.id = ?
    `).get(studentId);

    // 2. Attendance Summary
    const attSummary = db.prepare(`
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'OD' THEN 1 ELSE 0 END) as od_count
      FROM attendance
      WHERE student_id = ?
    `).get(studentId);

    const total = attSummary.total_classes || 0;
    const present = attSummary.present_count || 0;
    const absent = attSummary.absent_count || 0;
    const od = attSummary.od_count || 0;
    const percentage = total > 0 ? (((present + od) / total) * 100).toFixed(1) : '100.0';

    // 3. Subject-wise Attendance Breakdown
    const subjectBreakdown = db.prepare(`
      SELECT 
        sub.id as subject_id, sub.code as subject_code, sub.name as subject_name, sub.credits,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as percentage
      FROM subjects sub
      LEFT JOIN attendance a ON a.subject_id = sub.id AND a.student_id = ?
      WHERE sub.department_id = ? AND sub.year_level = ? AND sub.semester_num = ?
      GROUP BY sub.id
      ORDER BY sub.code ASC
    `).all(studentId, student.department_id, student.year_level, student.semester_num);

    // 4. Minimum required attendance from settings
    const minSetting = db.prepare(`SELECT setting_value FROM attendance_settings WHERE setting_key = 'minimum_attendance_percent'`).get();
    const minRequired = Number(minSetting ? minSetting.setting_value : 75);
    const isLowAttendance = Number(percentage) < minRequired;

    // 5. Recent Attendance Records (Last 10)
    const recentAttendance = db.prepare(`
      SELECT a.id, a.date, a.period, a.status, a.marked_at,
             sub.code as subject_code, sub.name as subject_name,
             u.name as faculty_name
      FROM attendance a
      JOIN subjects sub ON sub.id = a.subject_id
      JOIN faculty f ON f.id = a.faculty_id
      JOIN users u ON u.id = f.user_id
      WHERE a.student_id = ?
      ORDER BY a.date DESC, a.period DESC
      LIMIT 15
    `).all(studentId);

    // 6. Recent OD requests
    const recentOD = db.prepare(`
      SELECT * FROM od_requests
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(studentId);

    res.json({
      student,
      overall: {
        totalClasses: total,
        present,
        absent,
        od,
        percentage: Number(percentage),
        minRequired,
        isLowAttendance
      },
      subjectBreakdown,
      recentAttendance,
      recentOD
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch student dashboard stats' });
  }
});

// GET /api/students/:id - Detailed student view
router.get('/:id', authenticateToken, (req, res) => {
  const studentId = Number(req.params.id);

  // Student role restriction
  if (req.user.role === 'STUDENT' && req.user.studentId !== studentId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const student = db.prepare(`
      SELECT s.*, u.name, u.email, u.phone, u.avatar_url,
             d.name as department_name, d.code as department_code,
             sec.name as section_name, c.room_no
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      LEFT JOIN classes c ON c.id = s.class_id
      WHERE s.id = ?
    `).get(studentId);

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // HOD department check
    if (req.user.role === 'HOD' && req.user.departmentId !== student.department_id) {
      return res.status(403).json({ error: 'Access denied to students of other departments' });
    }

    // Attendance stats
    const attStats = db.prepare(`
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'OD' THEN 1 ELSE 0 END) as od_count
      FROM attendance
      WHERE student_id = ?
    `).get(studentId);

    const total = attStats.total_classes || 0;
    const present = attStats.present_count || 0;
    const absent = attStats.absent_count || 0;
    const od = attStats.od_count || 0;
    const percentage = total > 0 ? (((present + od) / total) * 100).toFixed(1) : '100.0';

    // Subject breakdown
    const subjectBreakdown = db.prepare(`
      SELECT 
        sub.id as subject_id, sub.code as subject_code, sub.name as subject_name,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as percentage
      FROM subjects sub
      LEFT JOIN attendance a ON a.subject_id = sub.id AND a.student_id = ?
      WHERE sub.department_id = ? AND sub.year_level = ? AND sub.semester_num = ?
      GROUP BY sub.id
    `).all(studentId, student.department_id, student.year_level, student.semester_num);

    // Full history
    const history = db.prepare(`
      SELECT a.id, a.date, a.period, a.status, a.marked_at,
             sub.code as subject_code, sub.name as subject_name,
             u.name as faculty_name
      FROM attendance a
      JOIN subjects sub ON sub.id = a.subject_id
      JOIN faculty f ON f.id = a.faculty_id
      JOIN users u ON u.id = f.user_id
      WHERE a.student_id = ?
      ORDER BY a.date DESC, a.period DESC
    `).all(studentId);

    res.json({
      student,
      summary: {
        total,
        present,
        absent,
        od,
        percentage: Number(percentage)
      },
      subjectBreakdown,
      history
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

// POST /api/students - Only faculty can add student details
router.post('/', authenticateToken, requireRoles('FACULTY', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { name, email, password, phone, register_no, department_id, year_level, semester_num, section_id, class_id, academic_year, admission_year } = req.body;

  const deptId = req.user.role === 'FACULTY' ? req.user.departmentId : (department_id || req.user.departmentId || 1);

  if (!name || !email || !register_no || !year_level || !semester_num) {
    return res.status(400).json({ error: 'Missing required student fields (name, email, register_no, year_level, semester_num)' });
  }

  try {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password || 'password123', salt);

    const userRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, 'STUDENT', ?)
    `).run(name.trim(), email.trim().toLowerCase(), passwordHash, phone || null);

    const stuRes = db.prepare(`
      INSERT INTO students (user_id, register_no, department_id, year_level, semester_num, section_id, class_id, academic_year, admission_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userRes.lastInsertRowid,
      register_no.trim().toUpperCase(),
      deptId,
      year_level,
      semester_num,
      section_id || null,
      class_id || null,
      academic_year || '2026-2027',
      admission_year || 2025
    );

    if (class_id) {
      db.prepare(`INSERT OR IGNORE INTO student_classes (student_id, class_id) VALUES (?, ?)`).run(stuRes.lastInsertRowid, class_id);
    }

    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'CREATE_STUDENT',
      'students',
      Number(stuRes.lastInsertRowid),
      req.user.id,
      req.user.name,
      req.user.role,
      null,
      JSON.stringify({ register_no, name, email, department_id: deptId, class_id }),
      'Faculty enrolled new student'
    );

    res.status(201).json({ id: stuRes.lastInsertRowid, message: 'Student created successfully' });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email or Register No already exists' });
    }
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT /api/students/:id - Only faculty can edit student details
router.put('/:id', authenticateToken, requireRoles('FACULTY', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const studentId = Number(req.params.id);
  const { name, email, phone, register_no, year_level, semester_num, class_id } = req.body;

  if (!name || !email || !register_no) {
    return res.status(400).json({ error: 'Name, email, and register number are required' });
  }

  try {
    const student = db.prepare(`SELECT s.*, u.id as user_id FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = ?`).get(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    // If faculty, verify they belong to same department
    if (req.user.role === 'FACULTY' && student.department_id !== req.user.departmentId) {
      return res.status(403).json({ error: 'Faculty can only edit students in their own department' });
    }

    // Update users table
    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, phone = ?
      WHERE id = ?
    `).run(name.trim(), email.trim().toLowerCase(), phone || null, student.user_id);

    // Update students table
    db.prepare(`
      UPDATE students
      SET register_no = ?,
          year_level = COALESCE(?, year_level),
          semester_num = COALESCE(?, semester_num),
          class_id = COALESCE(?, class_id)
      WHERE id = ?
    `).run(
      register_no.trim().toUpperCase(),
      year_level ? Number(year_level) : null,
      semester_num ? Number(semester_num) : null,
      class_id ? Number(class_id) : null,
      studentId
    );

    if (class_id) {
      db.prepare(`INSERT OR IGNORE INTO student_classes (student_id, class_id) VALUES (?, ?)`).run(studentId, Number(class_id));
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, 'students', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'UPDATE_STUDENT',
      studentId,
      req.user.id,
      req.user.name,
      req.user.role,
      JSON.stringify({ register_no: student.register_no, year_level: student.year_level }),
      JSON.stringify({ register_no, name, email, year_level, class_id }),
      'Faculty updated student details'
    );

    res.json({ message: 'Student details updated successfully' });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email or Register No already in use by another user' });
    }
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student details' });
  }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', authenticateToken, requireRoles('FACULTY', 'SUPER_ADMIN', 'ADMINISTRATOR'), (req, res) => {
  const studentId = Number(req.params.id);

  try {
    const stu = db.prepare(`SELECT user_id, register_no, department_id FROM students WHERE id = ?`).get(studentId);
    if (!stu) return res.status(404).json({ error: 'Student not found' });

    if (req.user.role === 'FACULTY' && stu.department_id !== req.user.departmentId) {
      return res.status(403).json({ error: 'Faculty can only remove students in their department' });
    }

    db.prepare(`DELETE FROM users WHERE id = ?`).run(stu.user_id);

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router;
