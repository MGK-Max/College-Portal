const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

function getSetting(key, defaultValue) {
  try {
    const row = db.prepare(`SELECT setting_value FROM attendance_settings WHERE setting_key = ?`).get(key);
    return row ? row.setting_value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// GET /api/reports/college
router.get('/college', authenticateToken, requireRoles('SUPER_ADMIN'), (req, res) => {
  try {
    const collegeName = getSetting('college_name', 'Kalaignarkaruanidhi Institute of Technology');
    const collegeCode = getSetting('college_code', 'KIT');

    const data = db.prepare(`
      SELECT 
        d.id as department_id, d.name as department_name, d.code as department_code,
        COUNT(DISTINCT c.id) as total_classes,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(a.id) as total_records,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od_count,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as percentage
      FROM departments d
      LEFT JOIN classes c ON c.department_id = d.id
      LEFT JOIN students s ON s.department_id = d.id
      LEFT JOIN attendance a ON a.class_id = c.id
      GROUP BY d.id
      ORDER BY d.id ASC
    `).all();

    res.json({
      meta: {
        reportType: 'COLLEGE ATTENDANCE REPORT',
        collegeName,
        collegeCode,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.name,
        userRole: req.user.role
      },
      data
    });
  } catch (error) {
    console.error('Error generating college report:', error);
    res.status(500).json({ error: 'Failed to generate college report' });
  }
});

// GET /api/reports/department
router.get('/department', authenticateToken, requireRoles('SUPER_ADMIN', 'HOD'), (req, res) => {
  const deptId = req.user.role === 'HOD' ? req.user.departmentId : Number(req.query.department_id || 1);

  try {
    const dept = db.prepare(`SELECT * FROM departments WHERE id = ?`).get(deptId);
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    const collegeName = getSetting('college_name', 'Kalaignarkaruanidhi Institute of Technology');

    const data = db.prepare(`
      SELECT 
        c.id as class_id, c.year_level, c.semester_num, c.room_no, sec.name as section_name,
        COUNT(DISTINCT s.id) as enrolled_students,
        COUNT(a.id) as total_attendance_records,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as percentage
      FROM classes c
      JOIN sections sec ON sec.id = c.section_id
      LEFT JOIN student_classes sc ON sc.class_id = c.id
      LEFT JOIN students s ON s.id = sc.student_id
      LEFT JOIN attendance a ON a.class_id = c.id
      WHERE c.department_id = ?
      GROUP BY c.id
      ORDER BY c.year_level, c.semester_num
    `).all(deptId);

    res.json({
      meta: {
        reportType: 'DEPARTMENT ATTENDANCE REPORT',
        collegeName,
        department: dept.name,
        departmentCode: dept.code,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.name,
        userRole: req.user.role
      },
      data
    });
  } catch (error) {
    console.error('Error generating department report:', error);
    res.status(500).json({ error: 'Failed to generate department report' });
  }
});

// GET /api/reports/class
router.get('/class', authenticateToken, requireRoles('SUPER_ADMIN', 'HOD', 'FACULTY'), (req, res) => {
  const classId = Number(req.query.class_id || 1);

  try {
    const cls = db.prepare(`
      SELECT c.*, d.name as department_name, d.code as department_code, sec.name as section_name
      FROM classes c
      JOIN departments d ON d.id = c.department_id
      JOIN sections sec ON sec.id = c.section_id
      WHERE c.id = ?
    `).get(classId);

    if (!cls) return res.status(404).json({ error: 'Class not found' });

    // HOD check
    if (req.user.role === 'HOD' && req.user.departmentId !== cls.department_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const collegeName = getSetting('college_name', 'Kalaignarkaruanidhi Institute of Technology');

    // Students enrolled in this class with their attendance metrics
    const data = db.prepare(`
      SELECT 
        s.id as student_id, s.register_no, u.name as student_name,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as percentage
      FROM student_classes sc
      JOIN students s ON s.id = sc.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.class_id = sc.class_id
      WHERE sc.class_id = ?
      GROUP BY s.id
      ORDER BY s.register_no ASC
    `).all(classId);

    res.json({
      meta: {
        reportType: 'CLASS ATTENDANCE REPORT',
        collegeName,
        department: cls.department_name,
        year: `Year ${cls.year_level} / Semester ${cls.semester_num}`,
        section: cls.section_name,
        room: cls.room_no,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.name,
        userRole: req.user.role
      },
      data
    });
  } catch (error) {
    console.error('Error generating class report:', error);
    res.status(500).json({ error: 'Failed to generate class report' });
  }
});

// GET /api/reports/subject
router.get('/subject', authenticateToken, requireRoles('SUPER_ADMIN', 'HOD', 'FACULTY'), (req, res) => {
  const subjectId = Number(req.query.subject_id || 1);

  try {
    const sub = db.prepare(`
      SELECT s.*, d.name as department_name
      FROM subjects s
      JOIN departments d ON d.id = s.department_id
      WHERE s.id = ?
    `).get(subjectId);

    if (!sub) return res.status(404).json({ error: 'Subject not found' });

    const collegeName = getSetting('college_name', 'Kalaignarkaruanidhi Institute of Technology');

    const data = db.prepare(`
      SELECT 
        s.id as student_id, s.register_no, u.name as student_name,
        c.year_level, sec.name as section_name,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as percentage
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN users u ON u.id = s.user_id
      JOIN classes c ON c.id = a.class_id
      JOIN sections sec ON sec.id = c.section_id
      WHERE a.subject_id = ?
      GROUP BY s.id
      ORDER BY s.register_no ASC
    `).all(subjectId);

    res.json({
      meta: {
        reportType: 'SUBJECT ATTENDANCE REPORT',
        collegeName,
        subject: `${sub.code} - ${sub.name}`,
        department: sub.department_name,
        credits: sub.credits,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.name,
        userRole: req.user.role
      },
      data
    });
  } catch (error) {
    console.error('Error generating subject report:', error);
    res.status(500).json({ error: 'Failed to generate subject report' });
  }
});

// GET /api/reports/faculty
router.get('/faculty', authenticateToken, requireRoles('SUPER_ADMIN', 'HOD'), (req, res) => {
  const facId = Number(req.query.faculty_id || 1);

  try {
    const fac = db.prepare(`
      SELECT f.*, u.name, u.email, d.name as department_name
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      JOIN departments d ON d.id = f.department_id
      WHERE f.id = ?
    `).get(facId);

    if (!fac) return res.status(404).json({ error: 'Faculty not found' });

    const collegeName = getSetting('college_name', 'Kalaignarkaruanidhi Institute of Technology');

    const data = db.prepare(`
      SELECT 
        s.code as subject_code, s.name as subject_name,
        c.year_level, sec.name as section_name,
        COUNT(DISTINCT a.date || '-' || a.period) as sessions_conducted,
        COUNT(a.id) as total_student_records,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as total_absent,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as total_od,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as avg_attendance
      FROM faculty_subjects fs
      JOIN subjects s ON s.id = fs.subject_id
      JOIN classes c ON c.id = fs.class_id
      JOIN sections sec ON sec.id = c.section_id
      LEFT JOIN attendance a ON a.faculty_id = fs.faculty_id AND a.subject_id = fs.subject_id AND a.class_id = fs.class_id
      WHERE fs.faculty_id = ?
      GROUP BY fs.id
    `).all(facId);

    res.json({
      meta: {
        reportType: 'FACULTY SESSIONS REPORT',
        collegeName,
        facultyName: fac.name,
        facultyCode: fac.faculty_code,
        department: fac.department_name,
        designation: fac.designation,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.name,
        userRole: req.user.role
      },
      data
    });
  } catch (error) {
    console.error('Error generating faculty report:', error);
    res.status(500).json({ error: 'Failed to generate faculty report' });
  }
});

// GET /api/reports/student
router.get('/student', authenticateToken, (req, res) => {
  const studentId = req.user.role === 'STUDENT' ? req.user.studentId : Number(req.query.student_id || 1);

  try {
    const st = db.prepare(`
      SELECT s.*, u.name, u.email, d.name as department_name, d.code as department_code, sec.name as section_name
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      WHERE s.id = ?
    `).get(studentId);

    if (!st) return res.status(404).json({ error: 'Student not found' });

    const collegeName = getSetting('college_name', 'Kalaignarkaruanidhi Institute of Technology');

    const data = db.prepare(`
      SELECT 
        sub.code as subject_code, sub.name as subject_name, sub.credits,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / CASE WHEN COUNT(a.id) = 0 THEN 1 ELSE COUNT(a.id) END) * 100, 1) as percentage
      FROM subjects sub
      LEFT JOIN attendance a ON a.subject_id = sub.id AND a.student_id = ?
      WHERE sub.department_id = ? AND sub.year_level = ?
      GROUP BY sub.id
      ORDER BY sub.code ASC
    `).all(studentId, st.department_id, st.year_level);

    res.json({
      meta: {
        reportType: 'STUDENT INDIVIDUAL ATTENDANCE REPORT',
        collegeName,
        studentName: st.name,
        registerNo: st.register_no,
        department: st.department_name,
        year: `Year ${st.year_level} / Sem ${st.semester_num}`,
        section: st.section_name,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.name,
        userRole: req.user.role
      },
      data
    });
  } catch (error) {
    console.error('Error generating student report:', error);
    res.status(500).json({ error: 'Failed to generate student report' });
  }
});

module.exports = router;
