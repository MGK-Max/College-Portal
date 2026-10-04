# 📊 College Attendance Management System - Database Viewer

> **Source Database:** `server/college_attendance.db`  
> **Status:** Online & Active  
> **Engine:** SQLite 3 (Node.js `node:sqlite` WAL Mode)

This document provides a human-readable, formatted view of all database tables and current records.

### Table Directory

| Table Name | Records | Description |
| :--- | :--- | :--- |
| [`academic_years`](#academic_years) | **2** | Academic years (e.g. 2025-2026) |
| [`attendance`](#attendance) | **1500** | Application data table |
| [`attendance_corrections`](#attendance_corrections) | **1** | Student dispute requests for attendance adjustments |
| [`attendance_settings`](#attendance_settings) | **8** | Application data table |
| [`audit_logs`](#audit_logs) | **4** | Tamper-evident logs of all attendance changes and actions |
| [`classes`](#classes) | **6** | Active class units with room assignments |
| [`departments`](#departments) | **3** | Academic departments (AI & DS, CSE, ECE) |
| [`faculty`](#faculty) | **12** | Faculty profiles with staff codes and department links |
| [`faculty_subjects`](#faculty_subjects) | **13** | Application data table |
| [`hods`](#hods) | **3** | HOD assignments linking users to departments |
| [`notifications`](#notifications) | **7** | In-app user notifications |
| [`od_requests`](#od_requests) | **4** | Application data table |
| [`sections`](#sections) | **6** | Sections per department, year level, and semester |
| [`semesters`](#semesters) | **8** | Semesters within academic years |
| [`student_classes`](#student_classes) | **54** | Application data table |
| [`students`](#students) | **54** | Enrolled students with roll numbers and section mapping |
| [`subjects`](#subjects) | **13** | Course curriculum and subjects per semester |
| [`timetable`](#timetable) | **78** | Weekly lecture schedule with period timings |
| [`users`](#users) | **70** | Registered users with credentials and roles (SUPER_ADMIN, HOD, FACULTY, STUDENT) |

---

## Table: `academic_years`

- **Total Rows:** 2
- **Description:** Academic years (e.g. 2025-2026)

| id | year_label | is_current |
| :--- | :--- | :--- |
| 1 | 2025-2026 | 0 |
| 2 | 2026-2027 | 1 |

---

## Table: `attendance`

- **Total Rows:** 1500
- **Description:** Application data table

| id | student_id | subject_id | class_id | faculty_id | date | period | status | late_flag | marked_at | updated_at |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 1 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 2 | 2 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 3 | 3 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 4 | 4 | 1 | 1 | 1 | 2026-09-15 | 1 | ABSENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 5 | 5 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 6 | 6 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 7 | 7 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 8 | 8 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 9 | 9 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 10 | 10 | 1 | 1 | 1 | 2026-09-15 | 1 | ABSENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 11 | 11 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 12 | 12 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 13 | 13 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 14 | 14 | 1 | 1 | 1 | 2026-09-15 | 1 | PRESENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |
| 15 | 15 | 1 | 1 | 1 | 2026-09-15 | 1 | ABSENT | 0 | 2026-09-15 09:02:15 | 2026-09-15 09:02:15 |

*Showing first 15 of 1500 records.*

---

## Table: `attendance_corrections`

- **Total Rows:** 1
- **Description:** Student dispute requests for attendance adjustments

| id | student_id | attendance_id | date | subject_id | current_status | requested_status | reason | document_url | status | faculty_id | faculty_comment | faculty_action_at | hod_id | hod_comment | hod_action_at | created_at |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 1 | *NULL* | 2026-09-22 | 2 | ABSENT | PRESENT | Was present in lab session showing DB... | https://example.com/docs/lab_sheet.pdf | PENDING | *NULL* | *NULL* | *NULL* | *NULL* | *NULL* | *NULL* | 2026-10-03 10:14:20 |

---

## Table: `attendance_settings`

- **Total Rows:** 8
- **Description:** Application data table

| id | setting_key | setting_value | description |
| :--- | :--- | :--- | :--- |
| 1 | minimum_attendance_percent | 75 | Minimum required attendance percentag... |
| 2 | late_allowance_minutes | 5 | Strict late window allowance in minut... |
| 3 | allow_faculty_editing | YES | Whether faculty is authorized to edit... |
| 4 | allow_attendance_correction | YES | Whether students can submit attendanc... |
| 5 | od_requires_faculty_approval | YES | Requires class faculty verification b... |
| 6 | od_requires_hod_approval | YES | Requires HOD final approval for On-Du... |
| 7 | college_name | Kalaignarkaruanidhi Institute of Tech... | Official College / University Name |
| 8 | college_code | KIT | College accreditation / institutional... |

---

## Table: `audit_logs`

- **Total Rows:** 4
- **Description:** Tamper-evident logs of all attendance changes and actions

| id | action | entity | entity_id | user_id | user_name | user_role | old_values | new_values | reason | timestamp |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | MARK_ATTENDANCE | attendance | 1 | 5 | Prof. Arunachalam S | FACULTY | NONE | {"class_id":1,"subject":"Java Program... | Regular period attendance marking com... | 2026-10-03 09:03:45 |
| 2 | APPROVE_OD | od_requests | 1 | 2 | Dr. Rajesh Sharma (HOD AI & DS) | HOD | {"status":"FACULTY_APPROVED"} | {"status":"HOD_APPROVED"} | HOD verified and authorized OD attend... | 2026-09-16 14:15:00 |
| 3 | MARK_ATTENDANCE | attendance | 1 | 5 | Prof. Arunachalam S | FACULTY | *NULL* | {"class_id":1,"subject_id":1,"date":"... | Attendance marked within authorized c... | 2026-10-03 10:31:40 |
| 4 | MARK_ATTENDANCE | attendance | 1 | 5 | Prof. Arunachalam S | FACULTY | *NULL* | {"class_id":1,"subject_id":1,"date":"... | Attendance submitted after 5-minute w... | 2026-10-03 10:32:22 |

---

## Table: `classes`

- **Total Rows:** 6
- **Description:** Active class units with room assignments

| id | department_id | year_level | semester_num | section_id | room_no | academic_year |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 1 | 2 | 3 | 1 | Room A204 | 2026-2027 |
| 2 | 1 | 2 | 3 | 2 | Room A205 | 2026-2027 |
| 3 | 1 | 3 | 5 | 3 | Room A301 | 2026-2027 |
| 4 | 2 | 2 | 3 | 4 | Room C101 | 2026-2027 |
| 5 | 2 | 3 | 5 | 5 | Room C201 | 2026-2027 |
| 6 | 3 | 2 | 3 | 6 | Room E102 | 2026-2027 |

---

## Table: `departments`

- **Total Rows:** 3
- **Description:** Academic departments (AI & DS, CSE, ECE)

| id | name | code | created_at |
| :--- | :--- | :--- | :--- |
| 1 | AI & Data Science | AD | 2026-10-03 10:14:14 |
| 2 | Computer Science & Engineering | CS | 2026-10-03 10:14:14 |
| 3 | Electronics & Communication | EC | 2026-10-03 10:14:14 |

---

## Table: `faculty`

- **Total Rows:** 12
- **Description:** Faculty profiles with staff codes and department links

| id | user_id | faculty_code | department_id | designation | phone |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 5 | FAC-AD01 | 1 | Associate Professor | +91 98401 33001 |
| 2 | 6 | FAC-AD02 | 1 | Professor | +91 98401 33002 |
| 3 | 7 | FAC-AD03 | 1 | Assistant Professor (Sr. Gr) | +91 98401 33003 |
| 4 | 8 | FAC-AD04 | 1 | Assistant Professor | +91 98401 33004 |
| 5 | 9 | FAC-CS01 | 2 | Professor | +91 98401 33005 |
| 6 | 10 | FAC-CS02 | 2 | Assistant Professor | +91 98401 33006 |
| 7 | 11 | FAC-CS03 | 2 | Assistant Professor | +91 98401 33007 |
| 8 | 12 | FAC-CS04 | 2 | Associate Professor | +91 98401 33008 |
| 9 | 13 | FAC-EC01 | 3 | Assistant Professor (Sr. Gr) | +91 98401 33009 |
| 10 | 14 | FAC-EC02 | 3 | Associate Professor | +91 98401 33010 |
| 11 | 15 | FAC-EC03 | 3 | Assistant Professor | +91 98401 33011 |
| 12 | 16 | FAC-EC04 | 3 | Professor | +91 98401 33012 |

---

## Table: `faculty_subjects`

- **Total Rows:** 13
- **Description:** Application data table

| id | faculty_id | subject_id | class_id |
| :--- | :--- | :--- | :--- |
| 1 | 1 | 1 | 1 |
| 2 | 2 | 2 | 1 |
| 3 | 3 | 3 | 1 |
| 4 | 4 | 4 | 1 |
| 5 | 1 | 5 | 2 |
| 6 | 2 | 6 | 3 |
| 7 | 5 | 7 | 4 |
| 8 | 6 | 8 | 4 |
| 9 | 7 | 9 | 4 |
| 10 | 8 | 10 | 5 |
| 11 | 9 | 11 | 6 |
| 12 | 10 | 12 | 6 |
| 13 | 11 | 13 | 6 |

---

## Table: `hods`

- **Total Rows:** 3
- **Description:** HOD assignments linking users to departments

| id | user_id | department_id | appointed_date |
| :--- | :--- | :--- | :--- |
| 1 | 2 | 1 | 2026-10-03 |
| 2 | 3 | 2 | 2026-10-03 |
| 3 | 4 | 3 | 2026-10-03 |

---

## Table: `notifications`

- **Total Rows:** 7
- **Description:** In-app user notifications

| id | user_id | title | message | type | is_read | link | created_at |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 5 | OD Request Approved | Your On-Duty application for "Inter-C... | SUCCESS | 0 | /student/od | 2026-10-03 10:14:20 |
| 2 | 5 | Attendance Marked Today | Attendance marked for Java Programmin... | INFO | 0 | /student/attendance | 2026-10-03 10:14:20 |
| 3 | 5 | OD Verification Pending | Student Arun Kumar has requested On-D... | ALERT | 0 | /faculty/od-verify | 2026-10-03 10:14:20 |
| 4 | 5 | Attendance Reminder | Today's Period 1 (09:00 AM) - Java Pr... | INFO | 0 | /faculty/attendance | 2026-10-03 10:14:20 |
| 5 | 2 | Pending OD Approvals | You have 1 verified On-Duty request p... | WARNING | 0 | /hod/od-approvals | 2026-10-03 10:14:20 |
| 6 | 2 | Low Attendance Alert | 2 students in II Year AI & DS have at... | ALERT | 0 | /hod/reports | 2026-10-03 10:14:20 |
| 7 | 1 | Daily System Audit | College-wide attendance tracking acti... | INFO | 0 | /admin/dashboard | 2026-10-03 10:14:20 |

---

## Table: `od_requests`

- **Total Rows:** 4
- **Description:** Application data table

| id | student_id | event_name | reason | location | description | date | from_time | to_time | document_url | status | faculty_id | faculty_comment | faculty_action_at | hod_id | hod_comment | hod_action_at | created_at |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 1 | Inter-College Hackathon 2026 | Selected as Team Lead for Smart India... | Anna University Auditorium, Chennai | Representing college in AI Innovation... | 2026-09-18 | 09:00 | 17:00 | https://example.com/docs/hackathon_in... | HOD_APPROVED | 1 | Verified participation documents. Hig... | 2026-09-16 11:30:00 | 1 | Approved. Good luck to the team. | 2026-09-16 14:15:00 | 2026-09-15 10:00:00 |
| 2 | 1 | IEEE Student Technical Symposium | Presenting Research Paper on Explaina... | IIT Madras Research Park | Invited presentation at IEEE Healthca... | 2026-09-29 | 09:00 | 16:30 | https://example.com/docs/ieee_accepta... | HOD_APPROVED | 1 | Paper reviewed by department. Excelle... | 2026-09-27 10:20:00 | 1 | Approved. Claim OD credit. | 2026-09-27 16:00:00 | 2026-09-26 15:45:00 |
| 3 | 1 | State Level Badminton Tournament | Selected for State Inter-Collegiate M... | Jawaharlal Nehru Indoor Stadium | Representing NIET Sports Council in s... | 2026-10-06 | 09:00 | 15:00 | https://example.com/docs/sports_selec... | FACULTY_APPROVED | 1 | Recommended by Physical Education Dir... | 2026-10-02 14:00:00 | *NULL* | *NULL* | *NULL* | 2026-10-02 09:30:00 |
| 4 | 3 | National Robotics Challenge | Autonomous Rover Track Round 2 | IIT Bombay Campus | Qualified in national preliminary scr... | 2026-10-08 | 09:00 | 17:00 | https://example.com/docs/robotics_inv... | PENDING | *NULL* | *NULL* | *NULL* | *NULL* | *NULL* | *NULL* | 2026-10-03 08:30:00 |

---

## Table: `sections`

- **Total Rows:** 6
- **Description:** Sections per department, year level, and semester

| id | name | department_id | year_level | semester_num |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Section A | 1 | 2 | 3 |
| 2 | Section B | 1 | 2 | 3 |
| 3 | Section A | 1 | 3 | 5 |
| 4 | Section A | 2 | 2 | 3 |
| 5 | Section A | 2 | 3 | 5 |
| 6 | Section A | 3 | 2 | 3 |

---

## Table: `semesters`

- **Total Rows:** 8
- **Description:** Semesters within academic years

| id | academic_year_id | semester_num | name |
| :--- | :--- | :--- | :--- |
| 1 | 2 | 1 | Semester 1 |
| 2 | 2 | 2 | Semester 2 |
| 3 | 2 | 3 | Semester 3 |
| 4 | 2 | 4 | Semester 4 |
| 5 | 2 | 5 | Semester 5 |
| 6 | 2 | 6 | Semester 6 |
| 7 | 2 | 7 | Semester 7 |
| 8 | 2 | 8 | Semester 8 |

---

## Table: `student_classes`

- **Total Rows:** 54
- **Description:** Application data table

| id | student_id | class_id | enrolled_date |
| :--- | :--- | :--- | :--- |
| 1 | 1 | 1 | 2026-10-03 |
| 2 | 2 | 1 | 2026-10-03 |
| 3 | 3 | 1 | 2026-10-03 |
| 4 | 4 | 1 | 2026-10-03 |
| 5 | 5 | 1 | 2026-10-03 |
| 6 | 6 | 1 | 2026-10-03 |
| 7 | 7 | 1 | 2026-10-03 |
| 8 | 8 | 1 | 2026-10-03 |
| 9 | 9 | 1 | 2026-10-03 |
| 10 | 10 | 1 | 2026-10-03 |
| 11 | 11 | 1 | 2026-10-03 |
| 12 | 12 | 1 | 2026-10-03 |
| 13 | 13 | 1 | 2026-10-03 |
| 14 | 14 | 1 | 2026-10-03 |
| 15 | 15 | 1 | 2026-10-03 |

*Showing first 15 of 54 records.*

---

## Table: `students`

- **Total Rows:** 54
- **Description:** Enrolled students with roll numbers and section mapping

| id | user_id | register_no | department_id | year_level | semester_num | section_id | class_id | academic_year | admission_year | photo_url |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 17 | AD301 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 2 | 18 | AD302 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 3 | 19 | AD303 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 4 | 20 | AD304 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 5 | 21 | AD305 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 6 | 22 | AD306 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 7 | 23 | AD307 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 8 | 24 | AD308 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 9 | 25 | AD309 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 10 | 26 | AD310 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 11 | 27 | AD311 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 12 | 28 | AD312 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 13 | 29 | AD313 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 14 | 30 | AD314 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |
| 15 | 31 | AD315 | 1 | 2 | 3 | 1 | 1 | 2026-2027 | 2025 | https://images.unsplash.com/photo-150... |

*Showing first 15 of 54 records.*

---

## Table: `subjects`

- **Total Rows:** 13
- **Description:** Course curriculum and subjects per semester

| id | code | name | department_id | year_level | semester_num | credits |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | AD301 | Java Programming | 1 | 2 | 3 | 4 |
| 2 | AD302 | Database Management Systems | 1 | 2 | 3 | 4 |
| 3 | AD303 | Discrete Mathematics | 1 | 2 | 3 | 4 |
| 4 | AD304 | Data Structures & Algorithms | 1 | 2 | 3 | 4 |
| 5 | AD305 | AI Principles & Ethics | 1 | 2 | 3 | 3 |
| 6 | AD501 | Machine Learning Foundations | 1 | 3 | 5 | 4 |
| 7 | CS201 | Operating Systems | 2 | 2 | 3 | 4 |
| 8 | CS202 | Computer Networks | 2 | 2 | 3 | 4 |
| 9 | CS203 | Theory of Computation | 2 | 2 | 3 | 3 |
| 10 | CS301 | Software Engineering & Agile | 2 | 3 | 5 | 3 |
| 11 | EC101 | Signals and Systems | 3 | 2 | 3 | 4 |
| 12 | EC102 | Digital Signal Processing | 3 | 2 | 3 | 4 |
| 13 | EC103 | Microprocessors & Microcontrollers | 3 | 2 | 3 | 3 |

---

## Table: `timetable`

- **Total Rows:** 78
- **Description:** Weekly lecture schedule with period timings

| id | day_of_week | period_num | start_time | end_time | subject_id | faculty_id | class_id | classroom |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Monday | 1 | 09:00 | 10:00 | 1 | 1 | 1 | Room A204 |
| 2 | Monday | 2 | 10:00 | 11:00 | 2 | 2 | 1 | Room A204 |
| 3 | Monday | 3 | 11:15 | 12:15 | 3 | 3 | 1 | Room A204 |
| 4 | Monday | 4 | 13:15 | 14:15 | 4 | 4 | 1 | Room A204 |
| 5 | Monday | 5 | 14:15 | 15:15 | 5 | 1 | 1 | Room A204 |
| 6 | Tuesday | 1 | 09:00 | 10:00 | 1 | 1 | 1 | Room A204 |
| 7 | Tuesday | 2 | 10:00 | 11:00 | 2 | 2 | 1 | Room A204 |
| 8 | Tuesday | 3 | 11:15 | 12:15 | 3 | 3 | 1 | Room A204 |
| 9 | Tuesday | 4 | 13:15 | 14:15 | 4 | 4 | 1 | Room A204 |
| 10 | Tuesday | 5 | 14:15 | 15:15 | 5 | 1 | 1 | Room A204 |
| 11 | Wednesday | 1 | 09:00 | 10:00 | 1 | 1 | 1 | Room A204 |
| 12 | Wednesday | 2 | 10:00 | 11:00 | 2 | 2 | 1 | Room A204 |
| 13 | Wednesday | 3 | 11:15 | 12:15 | 3 | 3 | 1 | Room A204 |
| 14 | Wednesday | 4 | 13:15 | 14:15 | 4 | 4 | 1 | Room A204 |
| 15 | Wednesday | 5 | 14:15 | 15:15 | 5 | 1 | 1 | Room A204 |

*Showing first 15 of 78 records.*

---

## Table: `users`

- **Total Rows:** 70
- **Description:** Registered users with credentials and roles (SUPER_ADMIN, HOD, FACULTY, STUDENT)

| id | email | password_hash | role | name | phone | avatar_url | created_at |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | admin@college.edu | `$2a$10$...` | SUPER_ADMIN | Dr. Alexander Bennett (Super Admin) | +91 98401 11000 | https://images.unsplash.com/photo-153... | 2026-10-03 10:14:14 |
| 2 | hod@college.edu | `$2a$10$...` | HOD | Dr. Rajesh Sharma (HOD AI & DS) | +91 98401 22001 | https://images.unsplash.com/photo-150... | 2026-10-03 10:14:14 |
| 3 | hod.cse@college.edu | `$2a$10$...` | HOD | Dr. Priya Ananth (HOD CSE) | +91 98401 22002 | https://images.unsplash.com/photo-157... | 2026-10-03 10:14:14 |
| 4 | hod.ece@college.edu | `$2a$10$...` | HOD | Dr. Suresh Balan (HOD ECE) | +91 98401 22003 | https://images.unsplash.com/photo-150... | 2026-10-03 10:14:14 |
| 5 | faculty@college.edu | `$2a$10$...` | FACULTY | Prof. Arunachalam S | +91 98401 33001 | https://images.unsplash.com/photo-147... | 2026-10-03 10:14:14 |
| 6 | meenakshi@college.edu | `$2a$10$...` | FACULTY | Dr. Meenakshi Sundaram | +91 98401 33002 | https://images.unsplash.com/photo-158... | 2026-10-03 10:14:14 |
| 7 | karthik@college.edu | `$2a$10$...` | FACULTY | Prof. Karthik Raman | +91 98401 33003 | https://images.unsplash.com/photo-151... | 2026-10-03 10:14:14 |
| 8 | deepa@college.edu | `$2a$10$...` | FACULTY | Prof. Deepa Nair | +91 98401 33004 | https://images.unsplash.com/photo-156... | 2026-10-03 10:14:14 |
| 9 | venkatesh@college.edu | `$2a$10$...` | FACULTY | Dr. Venkatesh Prasad | +91 98401 33005 | https://images.unsplash.com/photo-150... | 2026-10-03 10:14:14 |
| 10 | anitha@college.edu | `$2a$10$...` | FACULTY | Prof. Anitha Kumar | +91 98401 33006 | https://images.unsplash.com/photo-154... | 2026-10-03 10:14:14 |
| 11 | dinesh@college.edu | `$2a$10$...` | FACULTY | Prof. Dinesh Raj | +91 98401 33007 | https://images.unsplash.com/photo-152... | 2026-10-03 10:14:14 |
| 12 | shalini@college.edu | `$2a$10$...` | FACULTY | Dr. Shalini Verma | +91 98401 33008 | https://images.unsplash.com/photo-157... | 2026-10-03 10:14:14 |
| 13 | manoj@college.edu | `$2a$10$...` | FACULTY | Prof. Manoj Pillai | +91 98401 33009 | https://images.unsplash.com/photo-150... | 2026-10-03 10:14:14 |
| 14 | geetha@college.edu | `$2a$10$...` | FACULTY | Prof. Geetha Lakshmi | +91 98401 33010 | https://images.unsplash.com/photo-153... | 2026-10-03 10:14:14 |
| 15 | senthil@college.edu | `$2a$10$...` | FACULTY | Prof. Senthil Nathan | +91 98401 33011 | https://images.unsplash.com/photo-149... | 2026-10-03 10:14:14 |

*Showing first 15 of 70 records.*

---

