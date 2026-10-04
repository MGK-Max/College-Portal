const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

function resolveDeptId(req) {
  if (req.query && req.query.department_id) return Number(req.query.department_id);
  if (req.user && (req.user.departmentId || req.user.department_id)) return Number(req.user.departmentId || req.user.department_id);
  if (req.body && req.body.department_id) return Number(req.body.department_id);
  return 1;
}

// GET /api/hod - List all HODs or current HOD info
router.get('/', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT h.id, h.department_id, h.appointed_date,
             u.id as user_id, u.name, u.email, u.phone, u.avatar_url,
             d.name as department_name, d.code as department_code
      FROM hods h
      JOIN users u ON u.id = h.user_id
      JOIN departments d ON d.id = h.department_id
    `;

    if (req.user.role === 'HOD' && req.user.departmentId) {
      query += ` WHERE h.department_id = ${Number(req.user.departmentId)}`;
    }

    const hods = db.prepare(query).all();
    res.json(hods);
  } catch (error) {
    console.error('Error fetching HODs:', error);
    res.status(500).json({ error: 'Failed to fetch HOD details' });
  }
});

// POST /api/hod - Assign HOD (Super Admin only)
router.post('/', authenticateToken, requireRoles('SUPER_ADMIN'), (req, res) => {
  const { user_id, department_id } = req.body;

  if (!user_id || !department_id) {
    return res.status(400).json({ error: 'user_id and department_id are required' });
  }

  try {
    // Check if department already has an HOD
    const existing = db.prepare(`SELECT * FROM hods WHERE department_id = ?`).get(department_id);
    if (existing) {
      db.prepare(`DELETE FROM hods WHERE department_id = ?`).run(department_id);
    }

    // Ensure user has role 'HOD'
    db.prepare(`UPDATE users SET role = 'HOD' WHERE id = ?`).run(user_id);

    const result = db.prepare(`
      INSERT INTO hods (user_id, department_id, appointed_date)
      VALUES (?, ?, DATE('now'))
    `).run(user_id, department_id);

    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'ASSIGN_HOD',
      'hods',
      Number(result.lastInsertRowid),
      req.user.id,
      req.user.name,
      req.user.role,
      JSON.stringify(existing || {}),
      JSON.stringify({ user_id, department_id }),
      'Assigned HOD to department'
    );

    res.status(201).json({ message: 'HOD assigned successfully' });
  } catch (error) {
    console.error('Error assigning HOD:', error);
    res.status(500).json({ error: 'Failed to assign HOD' });
  }
});

// GET /api/hod/dashboard-stats - Specific stats for HOD
router.get('/dashboard-stats', authenticateToken, requireRoles('SUPER_ADMIN', 'ADMINISTRATOR', 'DEAN', 'HOD'), (req, res) => {
  const deptId = resolveDeptId(req);

  try {
    const dept = db.prepare(`SELECT name, code FROM departments WHERE id = ?`).get(deptId);
    const facultyCount = db.prepare(`SELECT COUNT(*) as count FROM faculty WHERE department_id = ?`).get(deptId).count;
    const studentCount = db.prepare(`SELECT COUNT(*) as count FROM students WHERE department_id = ?`).get(deptId).count;
    const classCount = db.prepare(`SELECT COUNT(*) as count FROM classes WHERE department_id = ?`).get(deptId).count;

    // Attendance stats in department
    const attStats = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'OD' THEN 1 ELSE 0 END) as od_count
      FROM attendance a
      JOIN classes c ON c.id = a.class_id
      WHERE c.department_id = ?
    `).get(deptId);

    const total = attStats.total_records || 0;
    const present = attStats.present_count || 0;
    const od = attStats.od_count || 0;
    const attendancePct = total > 0 ? (((present + od) / total) * 100).toFixed(1) : '100.0';

    // Pending OD requests
    const pendingODCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM od_requests o
      JOIN students s ON s.id = o.student_id
      WHERE s.department_id = ? AND o.status IN ('PENDING', 'FACULTY_APPROVED')
    `).get(deptId).count;

    // Low attendance students in department (<75%)
    const lowAttStudents = db.prepare(`
      SELECT s.id, s.register_no, u.name, sec.name as section_name, c.year_level,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1 ELSE 0 END) as attended,
        ROUND((SUM(CASE WHEN a.status IN ('PRESENT', 'OD') THEN 1.0 ELSE 0.0 END) / COUNT(a.id)) * 100, 1) as percentage
      FROM students s
      JOIN users u ON u.id = s.user_id
      JOIN classes c ON c.id = s.class_id
      JOIN sections sec ON sec.id = s.section_id
      JOIN attendance a ON a.student_id = s.id
      WHERE s.department_id = ?
      GROUP BY s.id
      HAVING percentage < 75.0 AND total_classes >= 5
      ORDER BY percentage ASC
    `).all(deptId);

    res.json({
      department: dept,
      facultyCount,
      studentCount,
      classCount,
      attendancePercentage: attendancePct,
      totalAttendanceRecords: total,
      presentCount: present,
      absentCount: attStats.absent_count || 0,
      odCount: od,
      pendingODCount,
      lowAttendanceCount: lowAttStudents.length,
      lowAttendanceStudents: lowAttStudents
    });
  } catch (error) {
    console.error('Error fetching HOD stats:', error);
    res.status(500).json({ error: 'Failed to fetch HOD stats' });
  }
});

// GET /api/hod/faculty - List faculty in HOD's department
router.get('/faculty', authenticateToken, requireRoles('HOD', 'ADMINISTRATOR', 'SUPER_ADMIN', 'DEAN'), (req, res) => {
  const deptId = resolveDeptId(req);
  try {
    const faculty = db.prepare(`
      SELECT f.id, f.faculty_code, f.designation, f.phone, f.cabin_room,
        u.id as user_id, u.name, u.email, u.avatar_url,
        d.name as department_name, d.code as department_code,
        (SELECT GROUP_CONCAT(c.room_no || ' (Yr ' || c.year_level || ' Sec ' || sec.name || ')', ', ')
         FROM classes c 
         JOIN sections sec ON sec.id = c.section_id
         WHERE c.mentor1_id = f.id OR c.mentor2_id = f.id) as mentoring_classes
      FROM faculty f
      JOIN users u ON u.id = f.user_id
      JOIN departments d ON d.id = f.department_id
      WHERE f.department_id = ?
      ORDER BY u.name ASC
    `).all(deptId);

    res.json({ faculty });
  } catch (err) {
    console.error('Error fetching HOD faculty:', err);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// POST /api/hod/faculty - Add a new faculty member (HOD, Admin)
router.post('/faculty', authenticateToken, requireRoles('HOD', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { name, email, password, faculty_code, designation, phone, cabin_room, department_id } = req.body;

  if (!name || !email || !faculty_code) {
    return res.status(400).json({ error: 'Name, email, and faculty code are required' });
  }

  const deptId = req.user.role === 'HOD' ? req.user.departmentId : Number(department_id || 1);
  const bcrypt = require('bcryptjs');

  try {
    const existing = db.prepare(`SELECT id FROM users WHERE LOWER(email) = LOWER(?)`).get(email.trim());
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const defaultPass = password || 'faculty123';
    const hash = bcrypt.hashSync(defaultPass, 10);

    const userRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, 'FACULTY', ?)
    `).run(name.trim(), email.trim().toLowerCase(), hash, phone || null);

    const facRes = db.prepare(`
      INSERT INTO faculty (user_id, faculty_code, department_id, designation, phone, cabin_room)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userRes.lastInsertRowid,
      faculty_code.trim().toUpperCase(),
      deptId,
      designation || 'Assistant Professor',
      phone || null,
      cabin_room || 'Faculty Cabin, Block A'
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, reason)
      VALUES (?, 'faculty', ?, ?, ?, ?, ?)
    `).run('ADD_FACULTY', facRes.lastInsertRowid, req.user.id, req.user.name, req.user.role, `Added faculty ${name} (${faculty_code})`);

    res.status(201).json({
      message: 'Faculty member created successfully',
      facultyId: facRes.lastInsertRowid,
      userId: userRes.lastInsertRowid
    });
  } catch (err) {
    console.error('Error adding faculty:', err);
    res.status(500).json({ error: err.message || 'Failed to add faculty' });
  }
});

// PUT /api/hod/faculty/:id - Only HOD can edit faculty details for their department
router.put('/faculty/:id', authenticateToken, requireRoles('HOD', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const facultyId = Number(req.params.id);
  const { name, email, faculty_code, designation, phone, cabin_room } = req.body;

  if (!name || !email || !faculty_code) {
    return res.status(400).json({ error: 'Name, email, and faculty code are required' });
  }

  try {
    const fac = db.prepare(`
      SELECT f.*, u.id as user_id 
      FROM faculty f 
      JOIN users u ON u.id = f.user_id 
      WHERE f.id = ?
    `).get(facultyId);

    if (!fac) {
      return res.status(404).json({ error: 'Faculty record not found' });
    }

    if (req.user.role === 'HOD' && fac.department_id !== req.user.departmentId) {
      return res.status(403).json({ error: 'HOD can only edit faculty within their own department' });
    }

    // Update users table
    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, phone = ?
      WHERE id = ?
    `).run(name.trim(), email.trim().toLowerCase(), phone || null, fac.user_id);

    // Update faculty table
    db.prepare(`
      UPDATE faculty
      SET faculty_code = ?,
          designation = ?,
          phone = ?,
          cabin_room = ?
      WHERE id = ?
    `).run(
      faculty_code.trim().toUpperCase(),
      designation || 'Assistant Professor',
      phone || null,
      cabin_room || 'Faculty Cabin, Block A',
      facultyId
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, 'faculty', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'UPDATE_FACULTY',
      facultyId,
      req.user.id,
      req.user.name,
      req.user.role,
      JSON.stringify({ faculty_code: fac.faculty_code, designation: fac.designation }),
      JSON.stringify({ faculty_code, name, email, designation, cabin_room }),
      'HOD updated faculty member details'
    );

    res.json({ message: 'Faculty details updated successfully' });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email or Faculty Code already in use by another faculty member' });
    }
    console.error('Error updating faculty:', error);
    res.status(500).json({ error: 'Failed to update faculty details' });
  }
});

// GET /api/hod/year-incharge - Get 1st, 2nd, 3rd, 4th year incharges
router.get('/year-incharge', authenticateToken, requireRoles('HOD', 'FACULTY', 'ADMINISTRATOR', 'SUPER_ADMIN', 'DEAN'), (req, res) => {
  const deptId = resolveDeptId(req);

  try {
    const incharges = db.prepare(`
      SELECT yi.*, u.name as faculty_name, u.email as faculty_email, f.faculty_code, f.designation,
        d.name as department_name, d.code as department_code
      FROM year_incharges yi
      JOIN faculty f ON f.id = yi.faculty_id
      JOIN users u ON u.id = f.user_id
      JOIN departments d ON d.id = yi.department_id
      WHERE yi.department_id = ?
      ORDER BY yi.year_level ASC
    `).all(deptId);

    // Format into standard Year 1..4 structure
    const yearLevels = [1, 2, 3, 4].map(yr => {
      const match = incharges.find(i => i.year_level === yr);
      return {
        year_level: yr,
        year_label: `${yr}${yr === 1 ? 'st' : yr === 2 ? 'nd' : yr === 3 ? 'rd' : 'th'} Year`,
        assigned: !!match,
        details: match || null
      };
    });

    res.json({ yearLevels, raw: incharges });
  } catch (err) {
    console.error('Error fetching year incharges:', err);
    res.status(500).json({ error: 'Failed to fetch year incharges' });
  }
});

// POST /api/hod/year-incharge - Set or replace year incharge for Year 1, 2, 3, 4
router.post('/year-incharge', authenticateToken, requireRoles('HOD', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { year_level, faculty_id, room_no, academic_year, department_id } = req.body;

  if (!year_level || !faculty_id) {
    return res.status(400).json({ error: 'Year level (1-4) and Faculty ID are required' });
  }

  const deptId = req.user.role === 'HOD' ? req.user.departmentId : Number(department_id || 1);
  const acadYear = academic_year || '2025-2026';

  try {
    // Check if already assigned
    const existing = db.prepare(`
      SELECT id FROM year_incharges WHERE department_id = ? AND year_level = ?
    `).get(deptId, Number(year_level));

    if (existing) {
      db.prepare(`
        UPDATE year_incharges
        SET faculty_id = ?, room_no = ?, academic_year = ?
        WHERE id = ?
      `).run(Number(faculty_id), room_no || `Year ${year_level} Incharge Office`, acadYear, existing.id);
    } else {
      db.prepare(`
        INSERT INTO year_incharges (department_id, year_level, faculty_id, academic_year, room_no)
        VALUES (?, ?, ?, ?, ?)
      `).run(deptId, Number(year_level), Number(faculty_id), acadYear, room_no || `Year ${year_level} Incharge Office`);
    }

    res.json({ message: `Year ${year_level} incharge assigned successfully` });
  } catch (err) {
    console.error('Error assigning year incharge:', err);
    res.status(500).json({ error: 'Failed to assign year incharge' });
  }
});

// GET /api/hod/classes - Get all classes in HOD department with 2 mentors
router.get('/classes', authenticateToken, requireRoles('HOD', 'FACULTY', 'ADMINISTRATOR', 'SUPER_ADMIN', 'DEAN'), (req, res) => {
  const deptId = resolveDeptId(req);

  try {
    const classes = db.prepare(`
      SELECT c.*, sec.name as section_name,
        f1.id as mentor1_id, u1.name as mentor1_name, f1.faculty_code as mentor1_code,
        f2.id as mentor2_id, u2.name as mentor2_name, f2.faculty_code as mentor2_code,
        (SELECT COUNT(*) FROM student_classes sc WHERE sc.class_id = c.id) as enrolled_count
      FROM classes c
      JOIN sections sec ON sec.id = c.section_id
      LEFT JOIN faculty f1 ON f1.id = c.mentor1_id
      LEFT JOIN users u1 ON u1.id = f1.user_id
      LEFT JOIN faculty f2 ON f2.id = c.mentor2_id
      LEFT JOIN users u2 ON u2.id = f2.user_id
      WHERE c.department_id = ?
      ORDER BY c.year_level ASC, sec.name ASC
    `).all(deptId);

    res.json({ classes });
  } catch (err) {
    console.error('Error fetching HOD classes:', err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST /api/hod/classes - Add a new class section for a year
router.post('/classes', authenticateToken, requireRoles('HOD', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { year_level, semester_num, section_name, room_no, academic_year, mentor1_id, mentor2_id, department_id } = req.body;

  if (!year_level || !section_name || !room_no) {
    return res.status(400).json({ error: 'Year level, section name, and room number are required' });
  }

  const deptId = req.user.role === 'HOD' ? req.user.departmentId : Number(department_id || 1);
  const semNum = Number(semester_num || (Number(year_level) * 2 - 1));
  const acadYear = academic_year || '2025-2026';

  try {
    // 1. Find or create section
    let sec = db.prepare(`
      SELECT id FROM sections 
      WHERE department_id = ? AND year_level = ? AND semester_num = ? AND LOWER(name) = LOWER(?)
    `).get(deptId, Number(year_level), semNum, section_name.trim());

    let secId;
    if (sec) {
      secId = sec.id;
    } else {
      const secRes = db.prepare(`
        INSERT INTO sections (name, department_id, year_level, semester_num)
        VALUES (?, ?, ?, ?)
      `).run(section_name.trim().toUpperCase(), deptId, Number(year_level), semNum);
      secId = secRes.lastInsertRowid;
    }

    // 2. Insert class with 2 mentors
    const classRes = db.prepare(`
      INSERT INTO classes (department_id, year_level, semester_num, section_id, room_no, academic_year, mentor1_id, mentor2_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      deptId,
      Number(year_level),
      semNum,
      secId,
      room_no.trim(),
      acadYear,
      mentor1_id ? Number(mentor1_id) : null,
      mentor2_id ? Number(mentor2_id) : null
    );

    res.status(201).json({
      message: `Class for Year ${year_level} Section ${section_name.toUpperCase()} created successfully with 2 mentors`,
      classId: classRes.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating class:', err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// POST /api/hod/assign-class - Assign/update 2 mentors to a class
router.post('/assign-class', authenticateToken, requireRoles('HOD', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { class_id, mentor1_id, mentor2_id } = req.body;

  if (!class_id) {
    return res.status(400).json({ error: 'class_id is required' });
  }

  try {
    db.prepare(`
      UPDATE classes 
      SET mentor1_id = ?, mentor2_id = ?
      WHERE id = ?
    `).run(
      mentor1_id ? Number(mentor1_id) : null,
      mentor2_id ? Number(mentor2_id) : null,
      Number(class_id)
    );

    res.json({ message: 'Class mentors assigned successfully' });
  } catch (err) {
    console.error('Error assigning class mentors:', err);
    res.status(500).json({ error: 'Failed to assign class mentors' });
  }
});

module.exports = router;
