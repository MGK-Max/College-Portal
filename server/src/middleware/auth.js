const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'college_attendance_super_secure_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Attach user information from DB to ensure it's up to date
    try {
      const user = db.prepare(`SELECT id, email, role, name, phone, avatar_url FROM users WHERE id = ?`).get(decoded.id);
      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }

      req.user = user;

      // Attach role-specific metadata
      if (user.role === 'DEAN') {
        const dean = db.prepare(`SELECT id, dean_code, title, cluster_scope, office_room FROM deans WHERE user_id = ?`).get(user.id);
        if (dean) {
          req.user.deanId = dean.id;
          req.user.deanCode = dean.dean_code;
          req.user.title = dean.title;
          req.user.clusterScope = dean.cluster_scope;
        }
      } else if (user.role === 'HOD') {
        const hod = db.prepare(`SELECT id, department_id FROM hods WHERE user_id = ?`).get(user.id);
        if (hod) {
          req.user.hodId = hod.id;
          req.user.departmentId = hod.department_id;
          req.user.department_id = hod.department_id;
        } else {
          req.user.departmentId = 1;
          req.user.department_id = 1;
        }
      } else if (user.role === 'FACULTY') {
        const fac = db.prepare(`SELECT id, faculty_code, department_id, designation FROM faculty WHERE user_id = ?`).get(user.id);
        if (fac) {
          req.user.facultyId = fac.id;
          req.user.departmentId = fac.department_id;
          req.user.facultyCode = fac.faculty_code;
          req.user.designation = fac.designation;
        }
      } else if (user.role === 'STUDENT') {
        const stu = db.prepare(`SELECT id, register_no, department_id, year_level, semester_num, section_id, class_id FROM students WHERE user_id = ?`).get(user.id);
        if (stu) {
          req.user.studentId = stu.id;
          req.user.registerNo = stu.register_no;
          req.user.departmentId = stu.department_id;
          req.user.yearLevel = stu.year_level;
          req.user.semesterNum = stu.semester_num;
          req.user.sectionId = stu.section_id;
          req.user.classId = stu.class_id;
        }
      }

      next();
    } catch (e) {
      console.error('Error fetching user context:', e);
      return res.status(500).json({ error: 'Authentication internal error' });
    }
  });
}

function requireRoles(...allowedRoles) {
  // Normalize roles: ADMINISTRATOR and SUPER_ADMIN are interchangeable
  const expandedRoles = new Set(allowedRoles);
  if (expandedRoles.has('SUPER_ADMIN') || expandedRoles.has('ADMINISTRATOR')) {
    expandedRoles.add('SUPER_ADMIN');
    expandedRoles.add('ADMINISTRATOR');
  }

  return (req, res, next) => {
    if (!req.user || !expandedRoles.has(req.user.role)) {
      return res.status(403).json({
        error: `Unauthorized. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user ? req.user.role : 'Guest'}`
      });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRoles
};
