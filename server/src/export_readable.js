const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.join(__dirname, '..', 'college_attendance.db');
const db = new DatabaseSync(dbPath);

const tablesStmt = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
const tables = tablesStmt.all();

// 1. Generate database_schema.sql
let schemaSql = `-- ==========================================================\n`;
schemaSql += `-- COLLEGE ATTENDANCE MANAGEMENT SYSTEM (CAMS)\n`;
schemaSql += `-- Clean Formatted SQL Schema\n`;
schemaSql += `-- Generated: ${new Date().toISOString()}\n`;
schemaSql += `-- Database: ${dbPath}\n`;
schemaSql += `-- ==========================================================\n\n`;

for (const table of tables) {
  schemaSql += `-- Table: ${table.name}\n`;
  schemaSql += `${table.sql};\n\n`;
}

const schemaPath = path.join(__dirname, '..', 'database_schema.sql');
fs.writeFileSync(schemaPath, schemaSql, 'utf8');

// 2. Generate database_preview.md
let md = `# 📊 College Attendance Management System - Database Viewer\n\n`;
md += `> **Source Database:** \`server/college_attendance.db\`  \n`;
md += `> **Status:** Online & Active  \n`;
md += `> **Engine:** SQLite 3 (Node.js \`node:sqlite\` WAL Mode)\n\n`;
md += `This document provides a human-readable, formatted view of all database tables and current records.\n\n`;
md += `### Table Directory\n\n`;
md += `| Table Name | Records | Description |\n`;
md += `| :--- | :--- | :--- |\n`;

const descriptions = {
  users: 'Registered users with credentials and roles (SUPER_ADMIN, HOD, FACULTY, STUDENT)',
  departments: 'Academic departments (AI & DS, CSE, ECE)',
  hods: 'HOD assignments linking users to departments',
  faculty: 'Faculty profiles with staff codes and department links',
  academic_years: 'Academic years (e.g. 2025-2026)',
  semesters: 'Semesters within academic years',
  sections: 'Sections per department, year level, and semester',
  classes: 'Active class units with room assignments',
  students: 'Enrolled students with roll numbers and section mapping',
  subjects: 'Course curriculum and subjects per semester',
  timetable: 'Weekly lecture schedule with period timings',
  attendance_sessions: 'Attendance session headers taken by faculty with server timestamps',
  attendance_records: 'Individual student attendance marks (PRESENT, ABSENT, OD, late flag)',
  on_duty_requests: 'OD applications submitted by students with multi-tier approval state',
  attendance_corrections: 'Student dispute requests for attendance adjustments',
  system_settings: 'College configuration (late mark limit, minimum attendance percentage)',
  audit_logs: 'Tamper-evident logs of all attendance changes and actions',
  notifications: 'In-app user notifications'
};

const tableData = [];

for (const table of tables) {
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`);
  const count = countStmt.get().count;
  const desc = descriptions[table.name] || 'Application data table';
  md += `| [\`${table.name}\`](#${table.name.toLowerCase()}) | **${count}** | ${desc} |\n`;

  // Fetch sample rows (up to 15)
  const rowsStmt = db.prepare(`SELECT * FROM "${table.name}" LIMIT 15`);
  const rows = rowsStmt.all();
  tableData.push({ name: table.name, count, rows, desc });
}

md += `\n---\n\n`;

for (const t of tableData) {
  md += `## Table: \`${t.name}\`\n\n`;
  md += `- **Total Rows:** ${t.count}\n`;
  md += `- **Description:** ${t.desc}\n\n`;

  if (t.rows.length === 0) {
    md += `*No records currently in this table.*\n\n`;
  } else {
    const columns = Object.keys(t.rows[0]);
    md += `| ${columns.join(' | ')} |\n`;
    md += `| ${columns.map(() => ':---').join(' | ')} |\n`;

    for (const row of t.rows) {
      const vals = columns.map(c => {
        let val = row[c];
        if (val === null || val === undefined) return '*NULL*';
        if (typeof val === 'string') {
          // Truncate long password hash for readability
          if (c === 'password_hash') return '`$2a$10$...`';
          if (val.length > 40) return val.slice(0, 37) + '...';
          return val.replace(/\|/g, '\\|').replace(/\n/g, ' ');
        }
        return String(val);
      });
      md += `| ${vals.join(' | ')} |\n`;
    }

    if (t.count > 15) {
      md += `\n*Showing first 15 of ${t.count} records.*\n\n`;
    } else {
      md += `\n`;
    }
  }

  md += `---\n\n`;
}

const previewPath = path.join(__dirname, '..', 'database_preview.md');
fs.writeFileSync(previewPath, md, 'utf8');

console.log('Successfully generated:');
console.log('1. ' + schemaPath);
console.log('2. ' + previewPath);
