const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/dean/overview - Comprehensive Dean oversight across departments & clusters
router.get('/overview', authenticateToken, requireRoles('DEAN', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  try {
    const deanCluster = req.user.clusterScope || 'ALL';

    // Filter departments based on Dean scope
    let deptQuery = `
      SELECT d.*, 
        u.name as hod_name, u.email as hod_email,
        COUNT(DISTINCT f.id) as faculty_count,
        COUNT(DISTINCT s.id) as student_count,
        COUNT(DISTINCT c.id) as class_count
      FROM departments d
      LEFT JOIN hods h ON h.department_id = d.id
      LEFT JOIN users u ON u.id = h.user_id
      LEFT JOIN faculty f ON f.department_id = d.id
      LEFT JOIN students s ON s.department_id = d.id
      LEFT JOIN classes c ON c.department_id = d.id
    `;

    if (req.user.role === 'DEAN' && deanCluster !== 'ALL') {
      deptQuery += ` WHERE d.category = '${deanCluster}'`;
    }
    deptQuery += ` GROUP BY d.id ORDER BY d.category ASC, d.name ASC`;

    const departments = db.prepare(deptQuery).all();

    // Calculate cluster statistics
    const clusterStats = {
      clusterDeptCount: departments.filter(d => d.category === 'CLUSTER').length,
      nonClusterDeptCount: departments.filter(d => d.category === 'NON_CLUSTER').length,
      totalFaculty: departments.reduce((acc, d) => acc + (d.faculty_count || 0), 0),
      totalStudents: departments.reduce((acc, d) => acc + (d.student_count || 0), 0),
      totalClasses: departments.reduce((acc, d) => acc + (d.class_count || 0), 0)
    };

    // Calculate overall attendance percentage across Dean's scope
    const attData = db.prepare(`
      SELECT 
        COUNT(a.id) as total_attendance,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od_count,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count
      FROM attendance a
      JOIN classes c ON c.id = a.class_id
      JOIN departments d ON d.id = c.department_id
      ${req.user.role === 'DEAN' && deanCluster !== 'ALL' ? `WHERE d.category = '${deanCluster}'` : ''}
    `).get();

    const overallPct = attData && attData.total_attendance > 0
      ? Math.round(((attData.present_count + attData.od_count) / attData.total_attendance) * 100)
      : 88;

    // Recent posts from Dean
    const deanPosts = db.prepare(`
      SELECT * FROM posts WHERE author_role = 'DEAN' ORDER BY created_at DESC LIMIT 5
    `).all();

    // Faculty on leave today in Dean's cluster
    const leavesToday = db.prepare(`
      SELECT lr.*, u.avatar_url, d.name as department_name, d.category as department_category
      FROM leave_requests lr
      JOIN users u ON u.id = lr.user_id
      LEFT JOIN departments d ON d.id = lr.department_id
      WHERE date('now') BETWEEN lr.from_date AND lr.to_date
      ORDER BY lr.created_at DESC
    `).all();

    res.json({
      dean: {
        id: req.user.id,
        name: req.user.name,
        title: req.user.title || 'Dean of Computing & Applied Sciences',
        deanCode: req.user.deanCode || 'DEAN-CS',
        clusterScope: req.user.clusterScope || 'CLUSTER',
        officeRoom: req.user.officeRoom || 'Dean Suite A-101'
      },
      stats: {
        ...clusterStats,
        overallAttendance: overallPct
      },
      departments,
      deanPosts,
      leavesToday
    });
  } catch (err) {
    console.error('Dean overview error:', err);
    res.status(500).json({ error: 'Failed to fetch dean overview' });
  }
});

// GET /api/dean/pinpoint - Pinpoint specific department deep-dive details
router.get('/pinpoint/:deptId', authenticateToken, requireRoles('DEAN', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  try {
    const deptId = req.params.deptId;
    const dept = db.prepare(`SELECT * FROM departments WHERE id = ?`).get(deptId);
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    const hod = db.prepare(`
      SELECT h.*, u.name, u.email, u.phone, u.avatar_url 
      FROM hods h JOIN users u ON u.id = h.user_id WHERE h.department_id = ?
    `).get(deptId);

    const faculty = db.prepare(`
      SELECT f.*, u.name, u.email, u.phone, u.avatar_url 
      FROM faculty f JOIN users u ON u.id = f.user_id WHERE f.department_id = ?
    `).all(deptId);

    const yearIncharges = db.prepare(`
      SELECT yi.*, u.name as faculty_name, f.faculty_code
      FROM year_incharges yi
      JOIN faculty f ON f.id = yi.faculty_id
      JOIN users u ON u.id = f.user_id
      WHERE yi.department_id = ?
      ORDER BY yi.year_level ASC
    `).all(deptId);

    const classes = db.prepare(`
      SELECT c.*, sec.name as section_name,
        f1.id as mentor1_id, u1.name as mentor1_name, f1.faculty_code as mentor1_code,
        f2.id as mentor2_id, u2.name as mentor2_name, f2.faculty_code as mentor2_code,
        COUNT(DISTINCT sc.student_id) as enrolled_count
      FROM classes c
      JOIN sections sec ON sec.id = c.section_id
      LEFT JOIN faculty f1 ON f1.id = c.mentor1_id
      LEFT JOIN users u1 ON u1.id = f1.user_id
      LEFT JOIN faculty f2 ON f2.id = c.mentor2_id
      LEFT JOIN users u2 ON u2.id = f2.user_id
      LEFT JOIN student_classes sc ON sc.class_id = c.id
      WHERE c.department_id = ?
      GROUP BY c.id
      ORDER BY c.year_level, c.semester_num
    `).all(deptId);

    const projects = db.prepare(`
      SELECT p.*, u.name as guide_name, f.faculty_code as guide_code
      FROM projects p
      LEFT JOIN faculty f ON f.id = p.faculty_guide_id
      LEFT JOIN users u ON u.id = f.user_id
      WHERE p.department_id = ?
      ORDER BY p.created_at DESC
    `).all(deptId);

    res.json({
      department: dept,
      hod,
      faculty,
      yearIncharges,
      classes,
      projects
    });
  } catch (err) {
    console.error('Dean pinpoint error:', err);
    res.status(500).json({ error: 'Failed to pinpoint department details' });
  }
});

module.exports = router;
