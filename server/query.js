const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'college_attendance.db');
const db = new DatabaseSync(dbPath);

const sql = process.argv.slice(2).join(' ') || "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";

try {
  const stmt = db.prepare(sql);
  const rows = stmt.all();
  console.log(`\nQuery: ${sql}`);
  console.log(`Returned ${rows.length} row(s):\n`);
  if (rows.length > 0) {
    console.table(rows);
  } else {
    console.log('No rows returned.');
  }
} catch (err) {
  console.error('SQL Error:', err.message);
}
