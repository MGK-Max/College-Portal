const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'college_attendance.db');
const db = new DatabaseSync(dbPath);

console.log('Starting Migration v2...');

db.exec(`PRAGMA foreign_keys = OFF;`);

// 1. Recreate users table to allow 'ADMINISTRATOR' and 'DEAN'
db.exec(`
  CREATE TABLE IF NOT EXISTS users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'ADMINISTRATOR', 'DEAN', 'HOD', 'FACULTY', 'STUDENT')),
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR REPLACE INTO users_new (id, email, password_hash, role, name, phone, avatar_url, created_at)
  SELECT id, email, password_hash, 
    CASE WHEN role = 'SUPER_ADMIN' THEN 'ADMINISTRATOR' ELSE role END,
    name, phone, avatar_url, created_at FROM users;

  DROP TABLE users;
  ALTER TABLE users_new RENAME TO users;
`);

// 2. Add category and dean_id to departments if not existing
const deptColumns = db.prepare(`PRAGMA table_info(departments)`).all().map(c => c.name);
if (!deptColumns.includes('category')) {
  db.exec(`ALTER TABLE departments ADD COLUMN category TEXT DEFAULT 'CLUSTER' CHECK(category IN ('CLUSTER', 'NON_CLUSTER'));`);
}
if (!deptColumns.includes('dean_id')) {
  db.exec(`ALTER TABLE departments ADD COLUMN dean_id INTEGER;`);
}

// 3. Update existing departments with appropriate cluster / non-cluster categories
db.exec(`
  UPDATE departments SET category = 'CLUSTER' WHERE code IN ('AD', 'CS', 'IT', 'AI', 'DS', 'CSBS', 'CY');
  UPDATE departments SET category = 'NON_CLUSTER' WHERE code IN ('EC', 'ECE', 'ME', 'MECH', 'CE', 'CIVIL', 'EE', 'EEE');
`);

// 4. Create Deans table
db.exec(`
  CREATE TABLE IF NOT EXISTS deans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    dean_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    cluster_scope TEXT DEFAULT 'ALL' CHECK(cluster_scope IN ('CLUSTER', 'NON_CLUSTER', 'ALL')),
    appointed_date DATE DEFAULT (DATE('now')),
    office_room TEXT DEFAULT 'Dean Secretariat, Block A',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 5. Add mentor1_id and mentor2_id to classes if not existing
const classColumns = db.prepare(`PRAGMA table_info(classes)`).all().map(c => c.name);
if (!classColumns.includes('mentor1_id')) {
  db.exec(`ALTER TABLE classes ADD COLUMN mentor1_id INTEGER;`);
}
if (!classColumns.includes('mentor2_id')) {
  db.exec(`ALTER TABLE classes ADD COLUMN mentor2_id INTEGER;`);
}

// 6. Year Incharges table (1st, 2nd, 3rd, 4th yr under HOD)
db.exec(`
  CREATE TABLE IF NOT EXISTS year_incharges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    year_level INTEGER NOT NULL CHECK(year_level IN (1, 2, 3, 4)),
    faculty_id INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    room_no TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_id, year_level, academic_year),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
  );
`);

// 7. Projects table (HOD & Faculty can manage)
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Capstone, Mini Project, R&D, Industry
    year_level INTEGER NOT NULL CHECK(year_level IN (1, 2, 3, 4)),
    faculty_guide_id INTEGER,
    student_team TEXT NOT NULL,
    status TEXT DEFAULT 'IN_PROGRESS' CHECK(status IN ('PROPOSED', 'IN_PROGRESS', 'REVIEW_PENDING', 'COMPLETED')),
    github_url TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_guide_id) REFERENCES faculty(id) ON DELETE SET NULL
  );
`);

// 8. Hackathons table (Faculty can add/record student hackathons)
db.exec(`
  CREATE TABLE IF NOT EXISTS hackathons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    faculty_id INTEGER,
    event_name TEXT NOT NULL,
    organizer TEXT NOT NULL,
    project_title TEXT NOT NULL,
    achievement TEXT NOT NULL, -- "1st Prize", "Runner Up", "Finalist", "Special Mention", "Participated"
    cash_prize TEXT,
    event_date DATE NOT NULL,
    certificate_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
  );
`);

// 9. Leave Requests table (Students, Faculty, HOD, Dean can request leave)
db.exec(`
  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    department_id INTEGER,
    leave_type TEXT NOT NULL, -- Casual Leave, Medical Leave, Academic OD, Vacation
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'APPROVED' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 10. Posts / Announcements table
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    department_id INTEGER,
    scope TEXT NOT NULL CHECK(scope IN ('COLLEGE_PUBLIC', 'DEAN_CLUSTER', 'DEPARTMENT_ONLY', 'DEPARTMENT_NEWS')),
    target_cluster TEXT DEFAULT 'ALL',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tag TEXT DEFAULT 'General',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 11. Add late reason & acceptable approval columns to attendance if not existing
const attColumns = db.prepare(`PRAGMA table_info(attendance)`).all().map(c => c.name);
if (!attColumns.includes('late_reason')) {
  db.exec(`ALTER TABLE attendance ADD COLUMN late_reason TEXT;`);
}
if (!attColumns.includes('late_reason_accepted')) {
  db.exec(`ALTER TABLE attendance ADD COLUMN late_reason_accepted INTEGER DEFAULT 0;`);
}
if (!attColumns.includes('late_approved_by')) {
  db.exec(`ALTER TABLE attendance ADD COLUMN late_approved_by INTEGER;`);
}
if (!attColumns.includes('late_approved_at')) {
  db.exec(`ALTER TABLE attendance ADD COLUMN late_approved_at DATETIME;`);
}

// 12. Create Dean User & Profile if not existing
const deanExists = db.prepare(`SELECT id FROM users WHERE email = 'dean@college.edu'`).get();
if (!deanExists) {
  const hash = bcrypt.hashSync('password123', 10);
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, name, phone, avatar_url)
    VALUES (?, ?, 'DEAN', ?, ?, ?)
  `);
  const deanUser = insertUser.run(
    'dean@college.edu',
    hash,
    'Dr. K. R. Shanmugam',
    '+91 94432 10987',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  db.prepare(`
    INSERT INTO deans (user_id, dean_code, title, cluster_scope, office_room)
    VALUES (?, 'DEAN-CS', 'Dean of Computing & Applied Sciences (Cluster Head)', 'CLUSTER', 'Dean Suite A-101')
  `).run(deanUser.lastInsertRowid);
  console.log('Created Dean profile for Dr. K. R. Shanmugam');
}

// 13. Assign Class Mentors (2 mentors per class)
const classes = db.prepare(`SELECT id, department_id FROM classes`).all();
const faculty = db.prepare(`SELECT id, department_id FROM faculty`).all();

for (const c of classes) {
  const deptFac = faculty.filter(f => f.department_id === c.department_id);
  const mentor1 = deptFac[0]?.id || faculty[0]?.id;
  const mentor2 = deptFac[1]?.id || faculty[1]?.id;
  db.prepare(`UPDATE classes SET mentor1_id = ?, mentor2_id = ? WHERE id = ?`).run(mentor1, mentor2, c.id);
}

// 14. Seed Year Incharges for department 1 (AI & DS)
const aiFaculty = faculty.filter(f => f.department_id === 1);
if (aiFaculty.length >= 4) {
  const checkY = db.prepare(`SELECT COUNT(*) as c FROM year_incharges WHERE department_id = 1`).get().c;
  if (checkY === 0) {
    const insertYi = db.prepare(`
      INSERT INTO year_incharges (department_id, year_level, faculty_id, academic_year, room_no)
      VALUES (?, ?, ?, '2026-2027', ?)
    `);
    insertYi.run(1, 1, aiFaculty[0].id, 'Block A - Room 101');
    insertYi.run(1, 2, aiFaculty[1].id, 'Block A - Room 204');
    insertYi.run(1, 3, aiFaculty[2].id, 'Block A - Room 305');
    insertYi.run(1, 4, aiFaculty[3].id, 'Block A - Room 402');
  }
}

// 15. Seed Sample Projects
const projCount = db.prepare(`SELECT COUNT(*) as c FROM projects`).get().c;
if (projCount === 0) {
  const insertProj = db.prepare(`
    INSERT INTO projects (department_id, title, category, year_level, faculty_guide_id, student_team, status, github_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProj.run(1, 'Autonomous Drone Navigation Using Computer Vision & Edge AI', 'Capstone', 4, aiFaculty[0]?.id || 1, 'Arun Kumar, Vignesh S, Sneha Reddy', 'IN_PROGRESS', 'https://github.com/kit-cams/edge-drone-ai', 'Real-time obstacle avoidance and path planning on Jetson Nano edge processor.');
  insertProj.run(1, 'Decentralized Academic Credential Verification on Blockchain', 'Mini Project', 3, aiFaculty[1]?.id || 2, 'Ravi Kumar, Priya Dharshini', 'REVIEW_PENDING', 'https://github.com/kit-cams/blockchain-creds', 'Tamper-proof verifiable diplomas using Ethereum smart contracts and IPFS.');
  insertProj.run(1, 'Smart Irrigation System using LoRaWAN and IoT Sensors', 'Industry Sponsored', 2, aiFaculty[2]?.id || 3, 'Gokul Krishnan, Ananya Rao', 'COMPLETED', 'https://github.com/kit-cams/smart-irrigation', 'Automated soil moisture monitoring and water pump control for agricultural fields.');
}

// 16. Seed Sample Hackathons
const hackCount = db.prepare(`SELECT COUNT(*) as c FROM hackathons`).get().c;
if (hackCount === 0) {
  const insertHack = db.prepare(`
    INSERT INTO hackathons (student_id, faculty_id, event_name, organizer, project_title, achievement, cash_prize, event_date, certificate_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertHack.run(1, aiFaculty[0]?.id || 1, 'Smart India Hackathon (SIH 2026)', 'Ministry of Education & AICTE', 'AI Crop Disease Detection System', '1st Prize', '₹1,00,000', '2026-09-15', 'https://example.com/certs/sih_winner.pdf');
  insertHack.run(1, aiFaculty[0]?.id || 1, 'HackNIT Coimbatore 2026', 'NIT Trichy / IEEE Student Branch', 'Healthcare Tele-Triage Bot', 'Runner Up', '₹50,000', '2026-08-20', 'https://example.com/certs/hacknit_runner.pdf');
  insertHack.run(2, aiFaculty[1]?.id || 2, 'Tamil Nadu Innovation Challenge (TNIC)', 'EDII-TN & Anna University', 'Autonomous Underwater Cleaning Robot', 'Finalist', '₹15,000', '2026-07-10', 'https://example.com/certs/tnic_finalist.pdf');
}

// 17. Seed Sample Posts
const postCount = db.prepare(`SELECT COUNT(*) as c FROM posts`).get().c;
if (postCount === 0) {
  const insertPost = db.prepare(`
    INSERT INTO posts (author_id, author_name, author_role, department_id, scope, target_cluster, title, content, tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // College Public post by Admin
  insertPost.run(1, 'Dr. Alexander Bennett', 'ADMINISTRATOR', null, 'COLLEGE_PUBLIC', 'ALL', 'Annual Technical Symposium & Project Expo 2026', 'All departments are invited to submit student project entries by Oct 15. Cash prizes worth ₹2,50,000 across Cluster and Non-Cluster categories.', 'Academic');
  // Dean Cluster post
  const deanUser = db.prepare(`SELECT id, name FROM users WHERE role = 'DEAN'`).get();
  if (deanUser) {
    insertPost.run(deanUser.id, deanUser.name, 'DEAN', null, 'DEAN_CLUSTER', 'CLUSTER', 'Computer Science Cluster: NAAC Peer Review Preparations', 'Mandatory faculty briefing scheduled this Friday at 3:00 PM in Seminar Hall 2 for all AI & DS, CSE, and IT departments.', 'Cluster Directive');
  }
  // HOD Department post
  const hodUser = db.prepare(`SELECT u.id, u.name, h.department_id FROM users u JOIN hods h ON h.user_id = u.id WHERE h.department_id = 1`).get();
  if (hodUser) {
    insertPost.run(hodUser.id, hodUser.name, 'HOD', 1, 'DEPARTMENT_ONLY', 'CLUSTER', 'Internal Assessment Test 2 Schedule & Answer Script Review', 'Faculty members are requested to complete evaluation within 4 working days. Mentors must review low attendance students.', 'Dept Notice');
    insertPost.run(hodUser.id, hodUser.name, 'HOD', 1, 'DEPARTMENT_NEWS', 'NON_CLUSTER', 'AI & DS Department hosts Faculty Development Program on Generative AI', 'Faculty members from ECE, Mechanical, and Civil are welcome to attend the 3-day hands-on workshop on PyTorch.', 'News');
  }
}

// 18. Seed Sample Leave Requests
const leaveCount = db.prepare(`SELECT COUNT(*) as c FROM leave_requests`).get().c;
if (leaveCount === 0) {
  const insertLeave = db.prepare(`
    INSERT INTO leave_requests (user_id, user_name, user_role, department_id, leave_type, from_date, to_date, reason, status, approved_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Faculty on leave
  const fac2 = faculty[1];
  if (fac2) {
    const fUser = db.prepare(`SELECT id, name FROM users WHERE id = (SELECT user_id FROM faculty WHERE id = ?)`).get(fac2.id);
    if (fUser) {
      insertLeave.run(fUser.id, fUser.name, 'FACULTY', fac2.department_id, 'Casual Leave', '2026-10-03', '2026-10-03', 'Attending University Doctoral Committee Meeting', 'APPROVED', 'Dr. Rajesh Sharma (HOD)');
    }
  }
  // Student on leave
  insertLeave.run(18, 'Ravi Kumar', 'STUDENT', 1, 'Medical Leave', '2026-10-03', '2026-10-04', 'Doctor consultation and recovery from viral fever', 'APPROVED', 'Prof. Arunachalam (Mentor)');
}

db.exec(`PRAGMA foreign_keys = ON;`);
console.log('Migration v2 completed successfully!');
