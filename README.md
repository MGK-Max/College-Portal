# 🎓 Kalaignarkaruanidhi Institute of Technology (KIT)
## Production College Attendance Management System (CAMS)

A complete, production-ready, database-connected, secure, responsive College Attendance Management System built with a Node.js + Express backend, SQLite relational database, and a React SPA frontend.

---

### 🌐 Accessing the Live Application
The application is currently compiled, seeded, and running locally:
- **Application URL:** [http://localhost:5000](http://localhost:5000)
- **API Base:** `http://localhost:5000/api`
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### 🔑 Demo Accounts (Instant 1-Click Access)
All accounts use the default password: **`password123`**  
*(You can also use the **Instant 1-Click Role Switcher** on the login screen or in the top navigation bar to switch between any role instantly without typing!)*

| Role | Email | Name & Designation | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@college.edu` | Dr. Alexander Bennett | Full college access, CRUD departments, faculty, students, timetables, rules, college reports, audit logs |
| **HOD (AI & DS)** | `hod@college.edu` | Dr. Rajesh Sharma | Department-scoped oversight, faculty monitoring, student attendance, OD multi-tier approval, low attendance |
| **Faculty** | `faculty@college.edu` | Prof. Arunachalam S | Assigned classes, Today's Timetable, **Take Attendance (5-min late rule & Mark All Present)**, verify OD |
| **Student** | `student@college.edu` | Arun Kumar (Reg: AD301) | Attendance percentage, subject breakdown, history, apply for OD, attendance correction requests |

---

### 🏛️ College Hierarchy Implemented
```
College (Kalaignarkaruanidhi Institute of Technology)
└── Departments (AI & DS, CSE, ECE)
    └── HOD (Dr. Rajesh Sharma, Dr. Priya Ananth, Dr. Suresh Balan)
        └── Faculty (12+ Professors & Lecturers)
            └── Classes & Sections (Year 2/3, Sections A/B, Rooms A204, A205, C101...)
                └── Students (54 Enrolled Students with Register Nos)
                    └── Subjects (Java Programming, DBMS, Discrete Math, DSA, OS, etc.)
                        └── Timetable (Periods 1 to 5, Weekly schedule)
                            └── Attendance (PRESENT, ABSENT, OD)
                                └── On-Duty (OD) (Student → Faculty → HOD Approval)
```

---

### ⏱️ Strict 5-Minute Late Rule & Server Clock Enforcement
1. **Rule Logic:**
   $$\text{elapsed\_minutes} = \frac{\text{current\_server\_time} - \text{class\_start\_time}}{60\text{ seconds}}$$
   - If $\text{elapsed\_minutes} \le \text{late\_allowance}$ (Default: 5 mins, configurable by Admin): **PRESENT is permitted**.
   - If $\text{elapsed\_minutes} > \text{late\_allowance}$: **PRESENT is strictly forbidden**. The student's status is automatically marked as **ABSENT** with internal `late_flag = 1`.
2. **Server-Side Enforcement:** Never trusts the client's device clock. The backend rejects or penalizes late submissions even if the frontend form is manipulated.
3. **Live Attendance Timer:**
   - Class starts: `09:00 AM`
   - Attendance closes: `09:05 AM`
   - Countdown ticker: `04:32`
   - Closed status: `ATTENDANCE WINDOW CLOSED`
4. **Built-in Rule Simulator:**
   - Includes a toggle on the attendance screen: **[Inside Window (< 5 min)]** vs **[Simulate Late (> 5 min)]** allowing examiners to test and verify both behaviors.

---

### ⚡ Feature Highlights
- **Mark All Present:** 1-click button to set all eligible students to PRESENT while keeping Approved OD students protected.
- **Permanent Database Persistence:** Complete transaction-safe SQLite schema storing every record permanently.
- **Confirmation Dialog:** Requires faculty confirmation before committing attendance.
- **Multi-Tier On-Duty (OD) Workflow:**
  $$\text{Student Application} \longrightarrow \text{Faculty Verification} \longrightarrow \text{HOD Official Approval} \longrightarrow \text{Automatic Attendance Credit}$$
- **Automatic OD:** Approved OD requests automatically pre-fill attendance as `OD` and count positively towards attendance percentage.
- **Attendance Percentage Formula:**
  $$\text{Attendance \%} = \frac{\text{Present} + \text{Approved OD}}{\text{Total Classes}} \times 100$$
- **Low Attendance Warnings:** Prominent alerts for students with attendance $< 75\%$ (configurable threshold).
- **Reports & Multi-Format Exports:**
  - Student, Faculty, Subject, Class, Department, and College reports.
  - Export to **PDF** (with official institutional header), **Excel (XLSX)**, and **CSV**.
- **Audit Logs:** Full audit trail tracking who marked/modified attendance, timestamp, student, old status, new status, and reason.

---

### 🛠️ Technology Stack
- **Frontend:** React 19, Vite, Lucide Icons, Plus Jakarta Sans & JetBrains Mono typography, custom responsive styling.
- **Backend:** Node.js, Express.js.
- **Database:** SQLite (built-in `node:sqlite` engine with foreign keys, indexes, and WAL journal mode).
- **Authentication:** JWT tokens, bcrypt password hashing, role-based middleware (`requireRoles`).
- **Export Libraries:** `jspdf`, `jspdf-autotable`, `xlsx`.

---

### 🚀 Running the System
To restart or run the server from the root directory:
```powershell
# Start Express Server (serves both API & Frontend)
npm start

# Run database seeder (re-populates sample data)
npm run seed

# Run frontend in Vite dev mode (optional, port 5173)
npm run client
```
