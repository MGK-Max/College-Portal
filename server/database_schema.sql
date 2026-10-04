-- ==========================================================
-- COLLEGE ATTENDANCE MANAGEMENT SYSTEM (CAMS)
-- Clean Formatted SQL Schema
-- Generated: 2026-10-03T12:06:07.513Z
-- Database: D:\New folder\server\college_attendance.db
-- ==========================================================

-- Table: academic_years
CREATE TABLE academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_label TEXT UNIQUE NOT NULL, -- e.g. "2025-2026", "2026-2027"
      is_current INTEGER DEFAULT 1
    );

-- Table: attendance
CREATE TABLE attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      faculty_id INTEGER NOT NULL,
      date DATE NOT NULL,
      period INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'OD')),
      late_flag INTEGER DEFAULT 0,
      marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, class_id, date, period),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
    );

-- Table: attendance_corrections
CREATE TABLE attendance_corrections (
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

-- Table: attendance_settings
CREATE TABLE attendance_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT
    );

-- Table: audit_logs
CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL, -- e.g. "MARK_ATTENDANCE", "UPDATE_ATTENDANCE", "CORRECTION_APPROVED"
      entity TEXT NOT NULL, -- "attendance", "od_request", "settings", etc.
      entity_id INTEGER,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- Table: classes
CREATE TABLE classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      year_level INTEGER NOT NULL,
      semester_num INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      room_no TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    );

-- Table: departments
CREATE TABLE departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- Table: faculty
CREATE TABLE faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      faculty_code TEXT UNIQUE NOT NULL,
      department_id INTEGER NOT NULL,
      designation TEXT NOT NULL,
      phone TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

-- Table: faculty_subjects
CREATE TABLE faculty_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      UNIQUE(faculty_id, subject_id, class_id),
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

-- Table: hods
CREATE TABLE hods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      department_id INTEGER UNIQUE NOT NULL,
      appointed_date DATE DEFAULT (DATE('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

-- Table: notifications
CREATE TABLE notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARNING', 'SUCCESS', 'ALERT'
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

-- Table: od_requests
CREATE TABLE od_requests (
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

-- Table: sections
CREATE TABLE sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, -- "Section A", "Section B"
      department_id INTEGER NOT NULL,
      year_level INTEGER NOT NULL, -- 1, 2, 3, 4
      semester_num INTEGER NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

-- Table: semesters
CREATE TABLE semesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year_id INTEGER NOT NULL,
      semester_num INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

-- Table: student_classes
CREATE TABLE student_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      enrolled_date DATE DEFAULT (DATE('now')),
      UNIQUE(student_id, class_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

-- Table: students
CREATE TABLE students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      register_no TEXT UNIQUE NOT NULL,
      department_id INTEGER NOT NULL,
      year_level INTEGER NOT NULL,
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

-- Table: subjects
CREATE TABLE subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      year_level INTEGER NOT NULL,
      semester_num INTEGER NOT NULL,
      credits INTEGER DEFAULT 3,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

-- Table: timetable
CREATE TABLE timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
      period_num INTEGER NOT NULL,
      start_time TEXT NOT NULL, -- e.g. "09:00"
      end_time TEXT NOT NULL,   -- e.g. "10:00"
      subject_id INTEGER NOT NULL,
      faculty_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      classroom TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

-- Table: users
CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'HOD', 'FACULTY', 'STUDENT')),
      name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

