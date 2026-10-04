const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'college_attendance.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  UPDATE attendance_settings 
  SET setting_value = 'Kalaignarkaruanidhi Institute of Technology' 
  WHERE setting_key = 'college_name';

  UPDATE attendance_settings 
  SET setting_value = 'KIT' 
  WHERE setting_key = 'college_code';
`);

const rows = db.prepare("SELECT * FROM attendance_settings WHERE setting_key IN ('college_name', 'college_code')").all();
console.log('Updated settings:');
console.table(rows);
