const { db, initSchema } = require('./db');
const bcrypt = require('bcryptjs');

function populate14Departments() {
  console.log('--- Ensuring All 14 Departments, HODs, Faculty, 1st-4th Year Classes & Chats ---');
  initSchema();

  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);

  const departmentsList = [
    { code: 'AD', name: 'Artificial Intelligence & Data Science', category: 'CLUSTER', hod: { name: 'Dr. Rajesh Sharma', email: 'hod.ad@college.edu', phone: '+91 98401 22001', room: 'Block A, Cabin 301', qual: 'Ph.D. in AI, IIT Madras' } },
    { code: 'CS', name: 'Computer Science & Engineering', category: 'CLUSTER', hod: { name: 'Dr. Priya Ananth', email: 'hod.cse@college.edu', phone: '+91 98401 22002', room: 'Block C, Cabin 401', qual: 'Ph.D. in Distributed Systems, IISc' } },
    { code: 'IT', name: 'Information Technology', category: 'CLUSTER', hod: { name: 'Dr. Muruganandam K', email: 'hod.it@college.edu', phone: '+91 98401 22004', room: 'Block C, Cabin 202', qual: 'Ph.D. in Cloud Computing, Anna Univ' } },
    { code: 'CB', name: 'Computer Science & Business Systems', category: 'CLUSTER', hod: { name: 'Dr. Savitha Raman', email: 'hod.csbs@college.edu', phone: '+91 98401 22005', room: 'Block C, Cabin 305', qual: 'Ph.D. in Enterprise Architecture, NIT' } },
    { code: 'AL', name: 'Artificial Intelligence & Machine Learning', category: 'CLUSTER', hod: { name: 'Dr. Anand Kumar', email: 'hod.aiml@college.edu', phone: '+91 98401 22006', room: 'Block A, Cabin 306', qual: 'Ph.D. in Deep Learning, IIT Delhi' } },
    { code: 'CY', name: 'Cyber Security', category: 'CLUSTER', hod: { name: 'Dr. Vikramaditya Sen', email: 'hod.cyber@college.edu', phone: '+91 98401 22007', room: 'Block A, Cyber Lab 102', qual: 'Ph.D. in Cryptography, BITS Pilani' } },
    { code: 'EC', name: 'Electronics & Communication Engineering', category: 'NON_CLUSTER', hod: { name: 'Dr. Suresh Balan', email: 'hod.ece@college.edu', phone: '+91 98401 22003', room: 'Block E, Cabin 101', qual: 'Ph.D. in VLSI Design, NIT Trichy' } },
    { code: 'EE', name: 'Electrical & Electronics Engineering', category: 'NON_CLUSTER', hod: { name: 'Dr. Chandrasekhar V', email: 'hod.eee@college.edu', phone: '+91 98401 22008', room: 'Block E, Power Systems Lab', qual: 'Ph.D. in Smart Grids, IIT Roorkee' } },
    { code: 'ME', name: 'Mechanical Engineering', category: 'NON_CLUSTER', hod: { name: 'Dr. Balasubramanian G', email: 'hod.mech@college.edu', phone: '+91 98401 22009', room: 'Workshop Complex B2', qual: 'Ph.D. in Thermal Engg, IIT Madras' } },
    { code: 'CE', name: 'Civil Engineering', category: 'NON_CLUSTER', hod: { name: 'Dr. Kavitha S', email: 'hod.civil@college.edu', phone: '+91 98401 22010', room: 'Structural Block D1', qual: 'Ph.D. in Structural Engineering, Anna Univ' } },
    { code: 'BM', name: 'Biomedical Engineering', category: 'NON_CLUSTER', hod: { name: 'Dr. Arvind Swaminathan', email: 'hod.bme@college.edu', phone: '+91 98401 22011', room: 'BioBlock 101', qual: 'Ph.D. in Medical Diagnostics, AIIMS' } },
    { code: 'BT', name: 'Biotechnology', category: 'NON_CLUSTER', hod: { name: 'Dr. Sharmila Devi', email: 'hod.biotech@college.edu', phone: '+91 98401 22012', room: 'BioTech Park Lab 3', qual: 'Ph.D. in Genomics, IISc' } },
    { code: 'AG', name: 'Agricultural Engineering', category: 'NON_CLUSTER', hod: { name: 'Dr. Ramalingam P', email: 'hod.agri@college.edu', phone: '+91 98401 22013', room: 'Agri Block Green Wing', qual: 'Ph.D. in Farm Machinery, TNAU' } },
    { code: 'MC', name: 'Mechatronics Engineering', category: 'NON_CLUSTER', hod: { name: 'Dr. Sivakumar K', email: 'hod.mct@college.edu', phone: '+91 98401 22014', room: 'Robotics Center B1', qual: 'Ph.D. in Robotics & Automation, IIT Bombay' } }
  ];

  const facultySurnames = ['Rao', 'Iyer', 'Nair', 'Menon', 'Verma', 'Patel', 'Krishnan', 'Pillai', 'Reddy', 'Sundaram', 'Sengupta', 'Mishra'];
  const designations = ['Professor', 'Associate Professor', 'Assistant Professor (Sr. Gr)', 'Assistant Professor'];

  for (const item of departmentsList) {
    let dept = db.prepare(`SELECT * FROM departments WHERE code = ?`).get(item.code);
    if (!dept) {
      const res = db.prepare(`INSERT INTO departments (name, code, category) VALUES (?, ?, ?)`).run(item.name, item.code, item.category);
      dept = { id: res.lastInsertRowid, name: item.name, code: item.code, category: item.category };
    } else {
      db.prepare(`UPDATE departments SET name = ?, category = ? WHERE id = ?`).run(item.name, item.category, dept.id);
    }

    // 1. Ensure HOD user & entry
    let hodUser = db.prepare(`SELECT * FROM users WHERE email = ?`).get(item.hod.email);
    if (!hodUser) {
      const userRes = db.prepare(`
        INSERT INTO users (email, password_hash, role, name, phone, avatar_url)
        VALUES (?, ?, 'HOD', ?, ?, ?)
      `).run(item.hod.email, defaultPasswordHash, `${item.hod.name} (HOD ${item.code})`, item.hod.phone, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
      hodUser = { id: userRes.lastInsertRowid };
    }

    const existingHod = db.prepare(`SELECT * FROM hods WHERE department_id = ?`).get(dept.id);
    if (!existingHod) {
      db.prepare(`INSERT INTO hods (user_id, department_id, appointed_date) VALUES (?, ?, '2023-06-01')`).run(hodUser.id, dept.id);
    }

    // 2. Ensure at least 8 faculty members exist for each department
    const currentFaculty = db.prepare(`SELECT f.*, u.name FROM faculty f JOIN users u ON u.id = f.user_id WHERE f.department_id = ?`).all(dept.id);
    let facList = [...currentFaculty];

    if (facList.length < 8) {
      const needed = 8 - facList.length;
      for (let i = 1; i <= needed; i++) {
        const facNum = facList.length + 1;
        const facEmail = `fac.${item.code.toLowerCase()}${facNum}@college.edu`;
        let userF = db.prepare(`SELECT * FROM users WHERE email = ?`).get(facEmail);
        const nameF = `Prof. ${item.code} Faculty ${facNum} ${facultySurnames[facNum % facultySurnames.length]}`;
        if (!userF) {
          const uRes = db.prepare(`
            INSERT INTO users (email, password_hash, role, name, phone, avatar_url)
            VALUES (?, ?, 'FACULTY', ?, ?, ?)
          `).run(facEmail, defaultPasswordHash, nameF, `+91 98401 ${30000 + dept.id * 100 + facNum}`, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
          userF = { id: uRes.lastInsertRowid };
        }
        const desig = designations[facNum % designations.length];
        const fRes = db.prepare(`
          INSERT INTO faculty (user_id, faculty_code, department_id, designation, phone, cabin_room)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(userF.id, `FAC-${item.code}${String(facNum).padStart(2, '0')}`, dept.id, desig, `+91 98401 ${30000 + dept.id * 100 + facNum}`, `Cabin ${100 + facNum}`);
        facList.push({ id: fRes.lastInsertRowid, user_id: userF.id, name: nameF });
      }
    }

    // 3. Ensure 1st, 2nd, 3rd, 4th Year Incharges
    for (let yr = 1; yr <= 4; yr++) {
      const existingIncharge = db.prepare(`SELECT * FROM year_incharges WHERE department_id = ? AND year_level = ?`).get(dept.id, yr);
      if (!existingIncharge && facList.length >= yr) {
        db.prepare(`
          INSERT INTO year_incharges (department_id, year_level, faculty_id, academic_year, room_no)
          VALUES (?, ?, ?, '2026-2027', ?)
        `).run(dept.id, yr, facList[yr - 1].id, `Year Incharge Office ${yr}0${dept.id}`);
      }
    }

    // 4. Ensure Classes & Sections for 1st, 2nd, 3rd, 4th Years
    // Each year has Section A (and Section B for years 2 & 3)
    const semMapping = { 1: 1, 2: 3, 3: 5, 4: 7 };
    for (let yr = 1; yr <= 4; yr++) {
      const sem = semMapping[yr];
      const sectionsForYear = (yr === 2 || yr === 3) ? ['Section A', 'Section B'] : ['Section A'];

      for (let sIdx = 0; sIdx < sectionsForYear.length; sIdx++) {
        const secName = sectionsForYear[sIdx];
        let sec = db.prepare(`SELECT * FROM sections WHERE department_id = ? AND year_level = ? AND name = ?`).get(dept.id, yr, secName);
        if (!sec) {
          const sRes = db.prepare(`INSERT INTO sections (name, department_id, year_level, semester_num) VALUES (?, ?, ?, ?)`).run(secName, dept.id, yr, sem);
          sec = { id: sRes.lastInsertRowid };
        }

        let cls = db.prepare(`SELECT * FROM classes WHERE department_id = ? AND year_level = ? AND section_id = ?`).get(dept.id, yr, sec.id);
        const mentor1 = facList[(yr * 2 - 2 + sIdx) % facList.length].id;
        const mentor2 = facList[(yr * 2 - 1 + sIdx) % facList.length].id;

        if (!cls) {
          const cRes = db.prepare(`
            INSERT INTO classes (department_id, year_level, semester_num, section_id, room_no, academic_year, mentor1_id, mentor2_id)
            VALUES (?, ?, ?, ?, ?, '2026-2027', ?, ?)
          `).run(dept.id, yr, sem, sec.id, `Room ${item.code}-${yr}0${sIdx + 1}`, mentor1, mentor2);
          cls = { id: cRes.lastInsertRowid };
        } else {
          db.prepare(`UPDATE classes SET mentor1_id = ?, mentor2_id = ? WHERE id = ?`).run(mentor1, mentor2, cls.id);
        }

        // 5. Ensure at least 15-20 students are enrolled in each class for demo
        const enrolledCount = db.prepare(`SELECT COUNT(*) as count FROM student_classes WHERE class_id = ?`).get(cls.id).count;
        if (enrolledCount < 15) {
          for (let st = 1; st <= (18 - enrolledCount); st++) {
            const regNo = `7112${item.code}${yr}${String(enrolledCount + st).padStart(2, '0')}`;
            let stuUser = db.prepare(`SELECT u.* FROM users u JOIN students s ON s.user_id = u.id WHERE s.register_no = ?`).get(regNo);
            if (!stuUser) {
              const uRes = db.prepare(`
                INSERT INTO users (email, password_hash, role, name, phone, avatar_url)
                VALUES (?, ?, 'STUDENT', ?, ?, ?)
              `).run(`student.${regNo.toLowerCase()}@college.edu`, defaultPasswordHash, `Student ${item.code} Yr${yr}-${enrolledCount + st}`, `+91 97890 ${10000 + enrolledCount + st}`, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
              const sRes = db.prepare(`
                INSERT INTO students (user_id, register_no, department_id, year_level, semester_num, section_id, class_id, academic_year, admission_year)
                VALUES (?, ?, ?, ?, ?, ?, ?, '2026-2027', ?)
              `).run(uRes.lastInsertRowid, regNo, dept.id, yr, sem, sec.id, cls.id, 2026 - yr + 1);
              db.prepare(`INSERT OR IGNORE INTO student_classes (student_id, class_id) VALUES (?, ?)`).run(sRes.lastInsertRowid, cls.id);
            }
          }
        }
      }
    }

    // 6. Ensure Department-wide Chat Messages
    const deptChatCount = db.prepare(`SELECT COUNT(*) as cnt FROM department_chats WHERE department_id = ? AND year_level IS NULL`).get(dept.id).cnt;
    if (deptChatCount === 0) {
      const hodDetails = db.prepare(`SELECT u.id, u.name FROM hods h JOIN users u ON u.id = h.user_id WHERE h.department_id = ?`).get(dept.id);
      db.prepare(`
        INSERT INTO department_chats (department_id, year_level, user_id, user_name, user_role, message, created_at)
        VALUES (?, NULL, ?, ?, 'HOD', ?, DATETIME('now', '-2 hours'))
      `).run(dept.id, hodDetails?.id || 1, hodDetails?.name || 'HOD', `Welcome to the official ${item.name} department communications channel. All academic circulars, symposium dates, and accreditation guidelines will be posted here.`);

      db.prepare(`
        INSERT INTO department_chats (department_id, year_level, user_id, user_name, user_role, message, created_at)
        VALUES (?, NULL, ?, ?, 'FACULTY', ?, DATETIME('now', '-45 minutes'))
      `).run(dept.id, facList[0].user_id, facList[0].name, `Reminder: Internal Assessment review papers must be submitted by this Friday 4:00 PM.`);
    }

    // 7. Ensure Year-specific Chat Messages (1st, 2nd, 3rd, 4th Year)
    for (let yr = 1; yr <= 4; yr++) {
      const yrChatCount = db.prepare(`SELECT COUNT(*) as cnt FROM department_chats WHERE department_id = ? AND year_level = ?`).get(dept.id, yr).cnt;
      if (yrChatCount === 0) {
        const incharge = db.prepare(`SELECT u.id, u.name FROM year_incharges yi JOIN faculty f ON f.id = yi.faculty_id JOIN users u ON u.id = f.user_id WHERE yi.department_id = ? AND yi.year_level = ?`).get(dept.id, yr);
        db.prepare(`
          INSERT INTO department_chats (department_id, year_level, user_id, user_name, user_role, message, created_at)
          VALUES (?, ?, ?, ?, 'YEAR_INCHARGE', ?, DATETIME('now', '-1 hours'))
        `).run(dept.id, yr, incharge?.id || 1, incharge?.name || `Year ${yr} Incharge`, `Notice for ${yr}${yr === 1 ? 'st' : yr === 2 ? 'nd' : yr === 3 ? 'rd' : 'th'} Year: Attendance eligibility criteria is strictly 75%. Please verify your attendance logs before the monthly audit.`);

        db.prepare(`
          INSERT INTO department_chats (department_id, year_level, user_id, user_name, user_role, message, created_at)
          VALUES (?, ?, ?, ?, 'FACULTY', ?, DATETIME('now', '-20 minutes'))
        `).run(dept.id, yr, facList[yr % facList.length].user_id, facList[yr % facList.length].name, `Tomorrow's lab session will be held in specialized lab block room ${item.code}-${yr}01.`);
      }
    }
  }

  console.log('✅ Successfully seeded/verified all 14 departments with HODs, Faculty, 1st-4th Year Classes, Mentors & Chats!');
}

if (require.main === module) {
  populate14Departments();
}

module.exports = { populate14Departments };
