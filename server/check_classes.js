const { db } = require('./src/db');
try {
  const deptId = 1;
  const dept = db.prepare(`SELECT * FROM departments WHERE id = ?`).get(deptId);
  console.log('Dept:', dept);

  const hod = db.prepare(`
    SELECT h.*, u.name, u.email, u.phone, u.avatar_url 
    FROM hods h JOIN users u ON u.id = h.user_id WHERE h.department_id = ?
  `).get(deptId);
  console.log('HOD:', hod);

  const faculty = db.prepare(`
    SELECT f.*, u.name, u.email, u.phone, u.avatar_url 
    FROM faculty f JOIN users u ON u.id = f.user_id WHERE f.department_id = ?
  `).all(deptId);
  console.log('Faculty count:', faculty.length);

  const yearIncharges = db.prepare(`
    SELECT yi.*, u.name as faculty_name, f.faculty_code
    FROM year_incharges yi
    JOIN faculty f ON f.id = yi.faculty_id
    JOIN users u ON u.id = f.user_id
    WHERE yi.department_id = ?
    ORDER BY yi.year_level ASC
  `).all(deptId);
  console.log('Year Incharges count:', yearIncharges.length);

  const classes = db.prepare(`
    SELECT c.*, sec.name as section_name,
      m1.id as mentor1_id, u1.name as mentor1_name, f1.faculty_code as mentor1_code,
      m2.id as mentor2_id, u2.name as mentor2_name, f2.faculty_code as mentor2_code,
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
  console.log('Classes count:', classes.length);

  const projects = db.prepare(`
    SELECT p.*, u.name as guide_name, f.faculty_code as guide_code
    FROM projects p
    LEFT JOIN faculty f ON f.id = p.faculty_guide_id
    LEFT JOIN users u ON u.id = f.user_id
    WHERE p.department_id = ?
    ORDER BY p.created_at DESC
  `).all(deptId);
  console.log('Projects count:', projects.length);
} catch (e) {
  console.error('ERROR in pinpoint query:', e);
}
