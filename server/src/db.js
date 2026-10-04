const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'college_attendance.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

function initSchema() {
  db.exec(`
    -- 1. Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'ADMINISTRATOR', 'DEAN', 'HOD', 'FACULTY', 'STUDENT')),
      name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Deans (Higher authority above HOD)
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

    -- 3. Departments (Categorized into CLUSTER vs NON_CLUSTER)
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'CLUSTER' CHECK(category IN ('CLUSTER', 'NON_CLUSTER')),
      dean_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dean_id) REFERENCES deans(id) ON DELETE SET NULL
    );

    -- 4. HODs
    CREATE TABLE IF NOT EXISTS hods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      department_id INTEGER UNIQUE NOT NULL,
      appointed_date DATE DEFAULT (DATE('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    -- 5. Faculty
    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      faculty_code TEXT UNIQUE NOT NULL,
      department_id INTEGER NOT NULL,
      designation TEXT NOT NULL,
      phone TEXT,
      cabin_room TEXT DEFAULT 'Faculty Cabin, Block A',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    -- 6. Academic Years & Semesters
    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_label TEXT UNIQUE NOT NULL,
      is_current INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS semesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year_id INTEGER NOT NULL,
      semester_num INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    -- 7. Sections
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      year_level INTEGER NOT NULL CHECK(year_level IN (1, 2, 3, 4)),
      semester_num INTEGER NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    -- 8. Classes (Each class has 2 mentors in-charge)
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      year_level INTEGER NOT NULL CHECK(year_level IN (1, 2, 3, 4)),
      semester_num INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      room_no TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      mentor1_id INTEGER,
      mentor2_id INTEGER,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      FOREIGN KEY (mentor1_id) REFERENCES faculty(id) ON DELETE SET NULL,
      FOREIGN KEY (mentor2_id) REFERENCES faculty(id) ON DELETE SET NULL
    );

    -- 9. Year Incharges (1st, 2nd, 3rd, 4th yr under HOD)
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

    -- 10. Students
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      register_no TEXT UNIQUE NOT NULL,
      department_id INTEGER NOT NULL,
      year_level INTEGER NOT NULL CHECK(year_level IN (1, 2, 3, 4)),
      semester_num INTEGER NOT NULL,
      section_id INTEGER,
      class_id INTEGER,
      academic_year TEXT NOT NULL,
      admission_year INTEGER NOT NULL,
      photo_url TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
    );

    -- 11. Student - Class Enrollments
    CREATE TABLE IF NOT EXISTS student_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      enrolled_date DATE DEFAULT (DATE('now')),
      UNIQUE(student_id, class_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    -- 12. Subjects
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      year_level INTEGER NOT NULL,
      semester_num INTEGER NOT NULL,
      credits INTEGER DEFAULT 3,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    -- 13. Faculty Subject Assignment
    CREATE TABLE IF NOT EXISTS faculty_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      UNIQUE(faculty_id, subject_id, class_id),
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    -- 14. Timetable
    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
      period_num INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject_id INTEGER NOT NULL,
      faculty_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      classroom TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    -- 15. Attendance (With 5-minute late rule & acceptable reason granting present)
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      faculty_id INTEGER NOT NULL,
      date DATE NOT NULL,
      period INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'OD')),
      late_flag INTEGER DEFAULT 0,
      late_reason TEXT,
      late_reason_accepted INTEGER DEFAULT 0,
      late_approved_by INTEGER,
      late_approved_at DATETIME,
      marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, class_id, date, period),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
      FOREIGN KEY (late_approved_by) REFERENCES faculty(id) ON DELETE SET NULL
    );

    -- 16. Projects (HOD & Faculty can manage)
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
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

    -- 17. Hackathons (Faculty can add student hackathon achievements)
    CREATE TABLE IF NOT EXISTS hackathons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      faculty_id INTEGER,
      event_name TEXT NOT NULL,
      organizer TEXT NOT NULL,
      project_title TEXT NOT NULL,
      achievement TEXT NOT NULL,
      cash_prize TEXT,
      event_date DATE NOT NULL,
      certificate_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL
    );

    -- 18. Leave Requests (Students, Faculty, HOD, Dean can request leave)
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      department_id INTEGER,
      leave_type TEXT NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'APPROVED' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      approved_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 19. Posts / Announcements
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

    -- 20. On-Duty (OD) Requests
    CREATE TABLE IF NOT EXISTS od_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      event_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      from_time TEXT NOT NULL,
      to_time TEXT NOT NULL,
      document_url TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'FACULTY_APPROVED', 'FACULTY_REJECTED', 'HOD_APPROVED', 'HOD_REJECTED')),
      faculty_id INTEGER,
      faculty_comment TEXT,
      faculty_action_at DATETIME,
      hod_id INTEGER,
      hod_comment TEXT,
      hod_action_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL,
      FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL
    );

    -- 21. Attendance Corrections
    CREATE TABLE IF NOT EXISTS attendance_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      attendance_id INTEGER,
      date DATE NOT NULL,
      subject_id INTEGER NOT NULL,
      current_status TEXT NOT NULL,
      requested_status TEXT NOT NULL,
      reason TEXT NOT NULL,
      document_url TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'FACULTY_APPROVED', 'FACULTY_REJECTED', 'HOD_APPROVED', 'HOD_REJECTED')),
      faculty_id INTEGER,
      faculty_comment TEXT,
      faculty_action_at DATETIME,
      hod_id INTEGER,
      hod_comment TEXT,
      hod_action_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL,
      FOREIGN KEY (hod_id) REFERENCES hods(id) ON DELETE SET NULL
    );

    -- 22. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'INFO',
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 23. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 24. Attendance Settings
    CREATE TABLE IF NOT EXISTS attendance_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT
    );

    -- 25. Department & Year Chats
    CREATE TABLE IF NOT EXISTS department_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      year_level INTEGER, -- NULL for department-wide, 1..4 for year-specific
      user_id INTEGER,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      avatar_url TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_att_student ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_att_date_class ON attendance(class_id, date, period);
    CREATE INDEX IF NOT EXISTS idx_att_subject ON attendance(subject_id);
    CREATE INDEX IF NOT EXISTS idx_tt_day_faculty ON timetable(day_of_week, faculty_id);
    CREATE INDEX IF NOT EXISTS idx_tt_day_class ON timetable(day_of_week, class_id);
    CREATE INDEX IF NOT EXISTS idx_od_date_student ON od_requests(date, student_id, status);
    CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_id, from_date, to_date);
    CREATE INDEX IF NOT EXISTS idx_posts_scope ON posts(scope, department_id);
    CREATE INDEX IF NOT EXISTS idx_dept_chats ON department_chats(department_id, year_level);
  `);
}

initSchema();

module.exports = {
  db,
  initSchema
};
