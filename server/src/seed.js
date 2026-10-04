const { db, initSchema } = require('./db');
const bcrypt = require('bcryptjs');

function runSeed() {
  console.log('--- Initializing Database Schema & Seeding Data ---');
  initSchema();

  // Clear existing data for fresh idempotency
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM notifications;
    DELETE FROM attendance_corrections;
    DELETE FROM od_requests;
    DELETE FROM attendance;
    DELETE FROM timetable;
    DELETE FROM faculty_subjects;
    DELETE FROM student_classes;
    DELETE FROM subjects;
    DELETE FROM classes;
    DELETE FROM sections;
    DELETE FROM semesters;
    DELETE FROM academic_years;
    DELETE FROM students;
    DELETE FROM faculty;
    DELETE FROM hods;
    DELETE FROM departments;
    DELETE FROM attendance_settings;
    DELETE FROM users;
  `);

  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);

  // 1. Settings
  const insertSetting = db.prepare(`
    INSERT INTO attendance_settings (setting_key, setting_value, description)
    VALUES (?, ?, ?)
  `);

  const settingsData = [
    ['minimum_attendance_percent', '75', 'Minimum required attendance percentage for exam eligibility'],
    ['late_allowance_minutes', '5', 'Strict late window allowance in minutes after class start time'],
    ['allow_faculty_editing', 'YES', 'Whether faculty is authorized to edit already submitted attendance'],
    ['allow_attendance_correction', 'YES', 'Whether students can submit attendance correction requests'],
    ['od_requires_faculty_approval', 'YES', 'Requires class faculty verification before HOD approval'],
    ['od_requires_hod_approval', 'YES', 'Requires HOD final approval for On-Duty attendance credit'],
    ['college_name', 'Kalaignarkaruanidhi Institute of Technology', 'Official College / University Name'],
    ['college_code', 'KIT', 'College accreditation / institutional code']
  ];
  for (const s of settingsData) {
    insertSetting.run(s[0], s[1], s[2]);
  }

  // 2. Departments
  const insertDept = db.prepare(`INSERT INTO departments (name, code) VALUES (?, ?)`);
  const deptAI = insertDept.run('AI & Data Science', 'AD').lastInsertRowid;
  const deptCS = insertDept.run('Computer Science & Engineering', 'CS').lastInsertRowid;
  const deptEC = insertDept.run('Electronics & Communication', 'EC').lastInsertRowid;

  // 3. Academic Years & Semesters
  const insertAy = db.prepare(`INSERT INTO academic_years (year_label, is_current) VALUES (?, ?)`);
  const ayPrev = insertAy.run('2025-2026', 0).lastInsertRowid;
  const ayCurr = insertAy.run('2026-2027', 1).lastInsertRowid;

  const insertSem = db.prepare(`INSERT INTO semesters (academic_year_id, semester_num, name) VALUES (?, ?, ?)`);
  for (let i = 1; i <= 8; i++) {
    insertSem.run(ayCurr, i, `Semester ${i}`);
  }

  // 4. Sections & Classes
  const insertSection = db.prepare(`INSERT INTO sections (name, department_id, year_level, semester_num) VALUES (?, ?, ?, ?)`);
  const secAD_A = insertSection.run('Section A', deptAI, 2, 3).lastInsertRowid;
  const secAD_B = insertSection.run('Section B', deptAI, 2, 3).lastInsertRowid;
  const secAD_3A = insertSection.run('Section A', deptAI, 3, 5).lastInsertRowid;
  const secCS_A = insertSection.run('Section A', deptCS, 2, 3).lastInsertRowid;
  const secCS_3A = insertSection.run('Section A', deptCS, 3, 5).lastInsertRowid;
  const secEC_A = insertSection.run('Section A', deptEC, 2, 3).lastInsertRowid;

  const insertClass = db.prepare(`
    INSERT INTO classes (department_id, year_level, semester_num, section_id, room_no, academic_year)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const classAD_2A = insertClass.run(deptAI, 2, 3, secAD_A, 'Room A204', '2026-2027').lastInsertRowid;
  const classAD_2B = insertClass.run(deptAI, 2, 3, secAD_B, 'Room A205', '2026-2027').lastInsertRowid;
  const classAD_3A = insertClass.run(deptAI, 3, 5, secAD_3A, 'Room A301', '2026-2027').lastInsertRowid;
  const classCS_2A = insertClass.run(deptCS, 2, 3, secCS_A, 'Room C101', '2026-2027').lastInsertRowid;
  const classCS_3A = insertClass.run(deptCS, 3, 5, secCS_3A, 'Room C201', '2026-2027').lastInsertRowid;
  const classEC_2A = insertClass.run(deptEC, 2, 3, secEC_A, 'Room E102', '2026-2027').lastInsertRowid;

  // 5. Users
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, name, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Super Admin
  const adminUser = insertUser.run('admin@college.edu', defaultPasswordHash, 'SUPER_ADMIN', 'Dr. Alexander Bennett (Super Admin)', '+91 98401 11000', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150').lastInsertRowid;

  // HODs
  const hodAIUser = insertUser.run('hod@college.edu', defaultPasswordHash, 'HOD', 'Dr. Rajesh Sharma (HOD AI & DS)', '+91 98401 22001', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150').lastInsertRowid;
  const hodCSUser = insertUser.run('hod.cse@college.edu', defaultPasswordHash, 'HOD', 'Dr. Priya Ananth (HOD CSE)', '+91 98401 22002', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150').lastInsertRowid;
  const hodECUser = insertUser.run('hod.ece@college.edu', defaultPasswordHash, 'HOD', 'Dr. Suresh Balan (HOD ECE)', '+91 98401 22003', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150').lastInsertRowid;

  const insertHod = db.prepare(`INSERT INTO hods (user_id, department_id) VALUES (?, ?)`);
  const hodAIId = insertHod.run(hodAIUser, deptAI).lastInsertRowid;
  const hodCSId = insertHod.run(hodCSUser, deptCS).lastInsertRowid;
  const hodECId = insertHod.run(hodECUser, deptEC).lastInsertRowid;

  // Faculty Members
  const insertFaculty = db.prepare(`
    INSERT INTO faculty (user_id, faculty_code, department_id, designation, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  // AI & DS Faculty
  const fac1User = insertUser.run('faculty@college.edu', defaultPasswordHash, 'FACULTY', 'Prof. Arunachalam S', '+91 98401 33001', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150').lastInsertRowid;
  const fac1 = insertFaculty.run(fac1User, 'FAC-AD01', deptAI, 'Associate Professor', '+91 98401 33001').lastInsertRowid;

  const fac2User = insertUser.run('meenakshi@college.edu', defaultPasswordHash, 'FACULTY', 'Dr. Meenakshi Sundaram', '+91 98401 33002', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150').lastInsertRowid;
  const fac2 = insertFaculty.run(fac2User, 'FAC-AD02', deptAI, 'Professor', '+91 98401 33002').lastInsertRowid;

  const fac3User = insertUser.run('karthik@college.edu', defaultPasswordHash, 'FACULTY', 'Prof. Karthik Raman', '+91 98401 33003', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150').lastInsertRowid;
  const fac3 = insertFaculty.run(fac3User, 'FAC-AD03', deptAI, 'Assistant Professor (Sr. Gr)', '+91 98401 33003').lastInsertRowid;

  const fac4User = insertUser.run('deepa@college.edu', defaultPasswordHash, 'FACULTY', 'Prof. Deepa Nair', '+91 98401 33004', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150').lastInsertRowid;
  const fac4 = insertFaculty.run(fac4User, 'FAC-AD04', deptAI, 'Assistant Professor', '+91 98401 33004').lastInsertRowid;

  // CSE Faculty
  const fac5User = insertUser.run('venkatesh@college.edu', defaultPasswordHash, 'FACULTY', 'Dr. Venkatesh Prasad', '+91 98401 33005', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150').lastInsertRowid;
  const fac5 = insertFaculty.run(fac5User, 'FAC-CS01', deptCS, 'Professor', '+91 98401 33005').lastInsertRowid;

  const fac6User = insertUser.run('anitha@college.edu', defaultPasswordHash, 'FACULTY', 'Prof. Anitha Kumar', '+91 98401 33006', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150').lastInsertRowid;
  const fac6 = insertFaculty.run(fac6User, 'FAC-CS02', deptCS, 'Assistant Professor', '+91 98401 33006').lastInsertRowid;

  const fac7User = insertUser.run('dinesh@college.edu', defaultPasswordHash, 'FACULTY', 'Prof. Dinesh Raj', '+91 98401 33007', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150').lastInsertRowid;
  const fac7 = insertFaculty.run(fac7User, 'FAC-CS03', deptCS, 'Assistant Professor', '+91 98401 33007').lastInsertRowid;

  const fac8User = insertUser.run('shalini@college.edu', defaultPasswordHash, 'FACULTY', 'Dr. Shalini Verma', '+91 98401 33008', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150').lastInsertRowid;
  const fac8 = insertFaculty.run(fac8User, 'FAC-CS04', deptCS, 'Associate Professor', '+91 98401 33008').lastInsertRowid;

  // ECE Faculty
  const fac9User = insertUser.run('manoj@college.edu', defaultPasswordHash, 'FACULTY', 'Prof. Manoj Pillai', '+91 98401 33009', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150').lastInsertRowid;
  const fac9 = insertFaculty.run(fac9User, 'FAC-EC01', deptEC, 'Assistant Professor (Sr. Gr)', '+91 98401 33009').lastInsertRowid;

  const fac10User = insertUser.run('geetha@college.edu', defaultPasswordHash, 'FACULTY', 'Prof. Geetha Lakshmi', '+91 98401 33010', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150').lastInsertRowid;
  const fac10 = insertFaculty.run(fac10User, 'FAC-EC02', deptEC, 'Associate Professor', '+91 98401 33010').lastInsertRowid;

  const fac11User = insertUser.run('senthil@college.edu', defaultPasswordHash, 'FACULTY', 'Prof. Senthil Nathan', '+91 98401 33011', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150').lastInsertRowid;
  const fac11 = insertFaculty.run(fac11User, 'FAC-EC03', deptEC, 'Assistant Professor', '+91 98401 33011').lastInsertRowid;

  const fac12User = insertUser.run('radhika@college.edu', defaultPasswordHash, 'FACULTY', 'Prof. Radhika Iyer', '+91 98401 33012', 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150').lastInsertRowid;
  const fac12 = insertFaculty.run(fac12User, 'FAC-EC04', deptEC, 'Professor', '+91 98401 33012').lastInsertRowid;

  // 6. Subjects
  const insertSubject = db.prepare(`
    INSERT INTO subjects (code, name, department_id, year_level, semester_num, credits)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // AI & DS Subjects
  const subJava = insertSubject.run('AD301', 'Java Programming', deptAI, 2, 3, 4).lastInsertRowid;
  const subDBMS = insertSubject.run('AD302', 'Database Management Systems', deptAI, 2, 3, 4).lastInsertRowid;
  const subMath = insertSubject.run('AD303', 'Discrete Mathematics', deptAI, 2, 3, 4).lastInsertRowid;
  const subDSA = insertSubject.run('AD304', 'Data Structures & Algorithms', deptAI, 2, 3, 4).lastInsertRowid;
  const subAI = insertSubject.run('AD305', 'AI Principles & Ethics', deptAI, 2, 3, 3).lastInsertRowid;
  const subML = insertSubject.run('AD501', 'Machine Learning Foundations', deptAI, 3, 5, 4).lastInsertRowid;

  // CSE Subjects
  const subOS = insertSubject.run('CS201', 'Operating Systems', deptCS, 2, 3, 4).lastInsertRowid;
  const subCN = insertSubject.run('CS202', 'Computer Networks', deptCS, 2, 3, 4).lastInsertRowid;
  const subTOC = insertSubject.run('CS203', 'Theory of Computation', deptCS, 2, 3, 3).lastInsertRowid;
  const subSE = insertSubject.run('CS301', 'Software Engineering & Agile', deptCS, 3, 5, 3).lastInsertRowid;

  // ECE Subjects
  const subSS = insertSubject.run('EC101', 'Signals and Systems', deptEC, 2, 3, 4).lastInsertRowid;
  const subDSP = insertSubject.run('EC102', 'Digital Signal Processing', deptEC, 2, 3, 4).lastInsertRowid;
  const subMPMC = insertSubject.run('EC103', 'Microprocessors & Microcontrollers', deptEC, 2, 3, 3).lastInsertRowid;

  // 7. Faculty-Subject Assignments
  const insertFacSub = db.prepare(`
    INSERT INTO faculty_subjects (faculty_id, subject_id, class_id)
    VALUES (?, ?, ?)
  `);

  insertFacSub.run(fac1, subJava, classAD_2A); // Prof. Arunachalam teaches Java in II AI & DS A
  insertFacSub.run(fac2, subDBMS, classAD_2A); // Dr. Meenakshi teaches DBMS in II AI & DS A
  insertFacSub.run(fac3, subMath, classAD_2A); // Prof. Karthik teaches Math in II AI & DS A
  insertFacSub.run(fac4, subDSA, classAD_2A);  // Prof. Deepa teaches DSA in II AI & DS A
  insertFacSub.run(fac1, subAI, classAD_2B);   // Prof. Arunachalam also teaches AI in II AI & DS B
  insertFacSub.run(fac2, subML, classAD_3A);   // Dr. Meenakshi teaches ML in III AI & DS A

  insertFacSub.run(fac5, subOS, classCS_2A);
  insertFacSub.run(fac6, subCN, classCS_2A);
  insertFacSub.run(fac7, subTOC, classCS_2A);
  insertFacSub.run(fac8, subSE, classCS_3A);

  insertFacSub.run(fac9, subSS, classEC_2A);
  insertFacSub.run(fac10, subDSP, classEC_2A);
  insertFacSub.run(fac11, subMPMC, classEC_2A);

  // 8. Timetable
  const insertTT = db.prepare(`
    INSERT INTO timetable (day_of_week, period_num, start_time, end_time, subject_id, faculty_id, class_id, classroom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Complete schedule for II AI & DS A
  for (const day of days) {
    insertTT.run(day, 1, '09:00', '10:00', subJava, fac1, classAD_2A, 'Room A204');
    insertTT.run(day, 2, '10:00', '11:00', subDBMS, fac2, classAD_2A, 'Room A204');
    insertTT.run(day, 3, '11:15', '12:15', subMath, fac3, classAD_2A, 'Room A204');
    insertTT.run(day, 4, '13:15', '14:15', subDSA, fac4, classAD_2A, 'Room A204');
    insertTT.run(day, 5, '14:15', '15:15', subAI, fac1, classAD_2A, 'Room A204');
  }

  // Schedule for II AI & DS B
  for (const day of days) {
    insertTT.run(day, 1, '10:00', '11:00', subAI, fac1, classAD_2B, 'Room A205');
    insertTT.run(day, 2, '11:15', '12:15', subJava, fac1, classAD_2B, 'Room A205');
    insertTT.run(day, 3, '13:15', '14:15', subDBMS, fac2, classAD_2B, 'Room A205');
  }

  // Schedule for II CSE A
  for (const day of days) {
    insertTT.run(day, 1, '09:00', '10:00', subOS, fac5, classCS_2A, 'Room C101');
    insertTT.run(day, 2, '10:00', '11:00', subCN, fac6, classCS_2A, 'Room C101');
    insertTT.run(day, 3, '11:15', '12:15', subTOC, fac7, classCS_2A, 'Room C101');
  }

  // Schedule for II ECE A
  for (const day of days) {
    insertTT.run(day, 1, '09:00', '10:00', subSS, fac9, classEC_2A, 'Room E102');
    insertTT.run(day, 2, '10:00', '11:00', subDSP, fac10, classEC_2A, 'Room E102');
  }

  // 9. Students (50+ students across departments)
  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, register_no, department_id, year_level, semester_num, section_id, class_id, academic_year, admission_year, photo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const enrollStudentClass = db.prepare(`
    INSERT INTO student_classes (student_id, class_id) VALUES (?, ?)
  `);

  const studentNamesAI = [
    'Arun Kumar', 'Ravi Kumar', 'Priya Dharshini', 'Gokul Krishnan', 'Sneha Reddy',
    'Vignesh S', 'Ananya Rao', 'Balaji M', 'Divya Bharathi', 'Harish Babu',
    'Janani R', 'Kavitha P', 'Lokesh K', 'Meera Nair', 'Naveen Raj',
    'Pavithra S', 'Rahul Gandhi', 'Sandhya Devi', 'Tarun V', 'Uma Maheshwari',
    'Vasanth C', 'Yamini T', 'Zakir Hussain', 'Aishwarya S', 'Chandran K'
  ];

  let studentIdListAI_2A = [];
  let primaryStudentId = null;

  for (let i = 0; i < studentNamesAI.length; i++) {
    const regNo = `AD3${(i + 1).toString().padStart(2, '0')}`;
    const email = i === 0 ? 'student@college.edu' : `student.${regNo.toLowerCase()}@college.edu`;
    const name = studentNamesAI[i];
    const phone = `+91 97890 ${(10000 + i).toString()}`;
    const avatar = `https://images.unsplash.com/photo-${1500000000000 + i * 10000}?w=150`;

    const uId = insertUser.run(email, defaultPasswordHash, 'STUDENT', name, phone, avatar).lastInsertRowid;
    const sId = insertStudent.run(uId, regNo, deptAI, 2, 3, secAD_A, classAD_2A, '2026-2027', 2025, avatar).lastInsertRowid;
    enrollStudentClass.run(sId, classAD_2A);

    studentIdListAI_2A.push({ id: sId, name, regNo });
    if (i === 0) primaryStudentId = sId;
  }

  // 15 Students in CSE
  const studentNamesCS = [
    'Abhishek Sharma', 'Deepak Verma', 'Geetha K', 'Hemant Patil', 'Ishwarya R',
    'Jitendra S', 'Kavya Menon', 'Manoj Kumar', 'Nithya S', 'Pradeep R',
    'Ramesh P', 'Sangeetha M', 'Tanya Roy', 'Varun Rao', 'Yuvaraj C'
  ];
  for (let i = 0; i < studentNamesCS.length; i++) {
    const regNo = `CS2${(i + 1).toString().padStart(2, '0')}`;
    const email = `cs.${regNo.toLowerCase()}@college.edu`;
    const name = studentNamesCS[i];
    const uId = insertUser.run(email, defaultPasswordHash, 'STUDENT', name, '+91 97891 00000', null).lastInsertRowid;
    const sId = insertStudent.run(uId, regNo, deptCS, 2, 3, secCS_A, classCS_2A, '2026-2027', 2025, null).lastInsertRowid;
    enrollStudentClass.run(sId, classCS_2A);
  }

  // 14 Students in ECE
  const studentNamesEC = [
    'Ajith Kumar', 'Bhavani S', 'Chetan M', 'Durga Rao', 'Ezhil Selvi',
    'Farhan Akhtar', 'Giri Prasad', 'Hema Malini', 'Indrajith V', 'Jaya Lakshmi',
    'Kishore K', 'Lavanya N', 'Mohan Raj', 'Nandini B'
  ];
  for (let i = 0; i < studentNamesEC.length; i++) {
    const regNo = `EC1${(i + 1).toString().padStart(2, '0')}`;
    const email = `ec.${regNo.toLowerCase()}@college.edu`;
    const name = studentNamesEC[i];
    const uId = insertUser.run(email, defaultPasswordHash, 'STUDENT', name, '+91 97892 00000', null).lastInsertRowid;
    const sId = insertStudent.run(uId, regNo, deptEC, 2, 3, secEC_A, classEC_2A, '2026-2027', 2025, null).lastInsertRowid;
    enrollStudentClass.run(sId, classEC_2A);
  }

  console.log(`Created 54 students across 3 departments.`);

  // 10. Sample Past Attendance Records (Generate multi-day history for realistic calculations)
  const insertAtt = db.prepare(`
    INSERT INTO attendance (student_id, subject_id, class_id, faculty_id, date, period, status, late_flag, marked_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Generate 15 days of past attendance for II AI & DS Section A
  const pastDates = [
    '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19',
    '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26',
    '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'
  ];

  const subjectsList = [
    { id: subJava, fac: fac1, period: 1 },
    { id: subDBMS, fac: fac2, period: 2 },
    { id: subMath, fac: fac3, period: 3 },
    { id: subDSA, fac: fac4, period: 4 }
  ];

  for (const dateStr of pastDates) {
    for (const sub of subjectsList) {
      for (let sIdx = 0; sIdx < studentIdListAI_2A.length; sIdx++) {
        const student = studentIdListAI_2A[sIdx];
        let status = 'PRESENT';
        let lateFlag = 0;

        // Give student AD304 (Gokul) OD on some days
        if (sIdx === 3 && (dateStr === '2026-09-23' || dateStr === '2026-09-24' || dateStr === '2026-10-01')) {
          status = 'OD';
        }
        // Give primary student Arun (AD301) occasional OD and few Absents for realistic ~86% attendance
        else if (sIdx === 0) {
          if (dateStr === '2026-09-18' || dateStr === '2026-09-29') {
            status = 'OD';
          } else if (dateStr === '2026-09-22' && sub.period === 2) {
            status = 'ABSENT';
          } else if (dateStr === '2026-10-02' && sub.period === 4) {
            status = 'ABSENT';
          }
        }
        // Give 2 students low attendance (<75%) to showcase low attendance warnings & reports!
        else if (sIdx === 9 || sIdx === 18) { // Harish Babu, Tarun V
          if (dateStr.endsWith('5') || dateStr.endsWith('2') || dateStr.endsWith('8') || dateStr.endsWith('0')) {
            status = 'ABSENT';
          }
        }
        // General random occasional absence
        else if ((sIdx * 7 + sub.period) % 11 === 0 && dateStr !== '2026-10-03') {
          status = 'ABSENT';
        }

        const markedAt = `${dateStr} 09:02:15`;
        insertAtt.run(
          student.id,
          sub.id,
          classAD_2A,
          sub.fac,
          dateStr,
          sub.period,
          status,
          lateFlag,
          markedAt,
          markedAt
        );
      }
    }
  }

  // 11. On-Duty (OD) Requests in various workflow stages
  const insertOD = db.prepare(`
    INSERT INTO od_requests (student_id, event_name, reason, location, description, date, from_time, to_time, document_url, status, faculty_id, faculty_comment, faculty_action_at, hod_id, hod_comment, hod_action_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Approved OD for Arun Kumar (primary student)
  insertOD.run(
    primaryStudentId,
    'Inter-College Hackathon 2026',
    'Selected as Team Lead for Smart India Hackathon Regional Finals',
    'Anna University Auditorium, Chennai',
    'Representing college in AI Innovations Track. Official permission granted by Dean.',
    '2026-09-18',
    '09:00',
    '17:00',
    'https://example.com/docs/hackathon_invitation.pdf',
    'HOD_APPROVED',
    fac1,
    'Verified participation documents. Highly recommended for technical honors.',
    '2026-09-16 11:30:00',
    hodAIId,
    'Approved. Good luck to the team.',
    '2026-09-16 14:15:00',
    '2026-09-15 10:00:00'
  );

  // Another Approved OD for Arun Kumar
  insertOD.run(
    primaryStudentId,
    'IEEE Student Technical Symposium',
    'Presenting Research Paper on Explainable AI for Healthcare',
    'IIT Madras Research Park',
    'Invited presentation at IEEE Healthcare Informatics track.',
    '2026-09-29',
    '09:00',
    '16:30',
    'https://example.com/docs/ieee_acceptance_letter.pdf',
    'HOD_APPROVED',
    fac1,
    'Paper reviewed by department. Excellent publication work.',
    '2026-09-27 10:20:00',
    hodAIId,
    'Approved. Claim OD credit.',
    '2026-09-27 16:00:00',
    '2026-09-26 15:45:00'
  );

  // Faculty Approved (Waiting for HOD approval) for Arun Kumar
  insertOD.run(
    primaryStudentId,
    'State Level Badminton Tournament',
    'Selected for State Inter-Collegiate Men Singles Championship',
    'Jawaharlal Nehru Indoor Stadium',
    'Representing KIT Sports Council in semifinals.',
    '2026-10-06',
    '09:00',
    '15:00',
    'https://example.com/docs/sports_selection_letter.pdf',
    'FACULTY_APPROVED',
    fac1,
    'Recommended by Physical Education Director.',
    '2026-10-02 14:00:00',
    null,
    null,
    null,
    '2026-10-02 09:30:00'
  );

  // Pending OD request from student AD303 (Priya Dharshini)
  insertOD.run(
    studentIdListAI_2A[2].id,
    'National Robotics Challenge',
    'Autonomous Rover Track Round 2',
    'IIT Bombay Campus',
    'Qualified in national preliminary screening.',
    '2026-10-08',
    '09:00',
    '17:00',
    'https://example.com/docs/robotics_invitation.pdf',
    'PENDING',
    null,
    null,
    null,
    null,
    null,
    null,
    '2026-10-03 08:30:00'
  );

  // 12. Attendance Corrections
  const insertCorrection = db.prepare(`
    INSERT INTO attendance_corrections (student_id, attendance_id, date, subject_id, current_status, requested_status, reason, document_url, status, faculty_id, faculty_comment, faculty_action_at, hod_id, hod_comment, hod_action_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCorrection.run(
    primaryStudentId,
    null,
    '2026-09-22',
    subDBMS,
    'ABSENT',
    'PRESENT',
    'Was present in lab session showing DBMS project demo to Prof. Meenakshi; biometric scan missed due to network glitch.',
    'https://example.com/docs/lab_sheet.pdf',
    'PENDING',
    null,
    null,
    null,
    null,
    null,
    null
  );

  // 13. Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    'MARK_ATTENDANCE',
    'attendance',
    1,
    fac1User,
    'Prof. Arunachalam S',
    'FACULTY',
    'NONE',
    JSON.stringify({ class_id: classAD_2A, subject: 'Java Programming', date: '2026-10-03', period: 1, present_count: 24, absent_count: 1 }),
    'Regular period attendance marking completed within allowed window.',
    '2026-10-03 09:03:45'
  );

  insertAudit.run(
    'APPROVE_OD',
    'od_requests',
    1,
    hodAIUser,
    'Dr. Rajesh Sharma (HOD AI & DS)',
    'HOD',
    JSON.stringify({ status: 'FACULTY_APPROVED' }),
    JSON.stringify({ status: 'HOD_APPROVED' }),
    'HOD verified and authorized OD attendance credit.',
    '2026-09-16 14:15:00'
  );

  // 14. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Notifications for primary student
  insertNotif.run(
    insertUser.database ? 0 : 5, // student user id
    'OD Request Approved',
    'Your On-Duty application for "Inter-College Hackathon 2026" has been approved by HOD.',
    'SUCCESS',
    '/student/od'
  );
  insertNotif.run(
    5,
    'Attendance Marked Today',
    'Attendance marked for Java Programming (Period 1): Present.',
    'INFO',
    '/student/attendance'
  );

  // Notifications for faculty
  insertNotif.run(
    fac1User,
    'OD Verification Pending',
    'Student Arun Kumar has requested On-Duty for State Level Badminton Tournament.',
    'ALERT',
    '/faculty/od-verify'
  );
  insertNotif.run(
    fac1User,
    'Attendance Reminder',
    'Today\'s Period 1 (09:00 AM) - Java Programming class is scheduled in Room A204.',
    'INFO',
    '/faculty/attendance'
  );

  // Notifications for HOD
  insertNotif.run(
    hodAIUser,
    'Pending OD Approvals',
    'You have 1 verified On-Duty request pending final approval.',
    'WARNING',
    '/hod/od-approvals'
  );
  insertNotif.run(
    hodAIUser,
    'Low Attendance Alert',
    '2 students in II Year AI & DS have attendance below 75%.',
    'ALERT',
    '/hod/reports'
  );

  // Notifications for Admin
  insertNotif.run(
    adminUser,
    'Daily System Audit',
    'College-wide attendance tracking active across 3 departments and 6 classes.',
    'INFO',
    '/admin/dashboard'
  );

  console.log('--- Database seeding completed successfully! ---');
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
