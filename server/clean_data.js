const { db } = require('./src/db');

console.log('--- PURGING ALL DEMO/MOCK DETAILS FOR PURE MANUAL UPLOAD MODE ---');

db.exec('BEGIN TRANSACTION;');

try {
  // 1. Delete all attendance and correction records
  const att = db.prepare('DELETE FROM attendance').run();
  const corr = db.prepare('DELETE FROM attendance_corrections').run();
  console.log(`✓ Cleared attendance records: ${att.changes}`);
  console.log(`✓ Cleared attendance corrections: ${corr.changes}`);

  // 2. Delete all OD requests
  const od = db.prepare('DELETE FROM od_requests').run();
  console.log(`✓ Cleared OD applications: ${od.changes}`);

  // 3. Delete all hackathons
  const hack = db.prepare('DELETE FROM hackathons').run();
  console.log(`✓ Cleared hackathon achievements: ${hack.changes}`);

  // 4. Delete all projects
  const proj = db.prepare('DELETE FROM projects').run();
  console.log(`✓ Cleared capstone/department projects: ${proj.changes}`);

  // 5. Delete all leave requests
  const leaves = db.prepare('DELETE FROM leave_requests').run();
  console.log(`✓ Cleared leave requests: ${leaves.changes}`);

  // 6. Delete all posts / circulars
  const posts = db.prepare('DELETE FROM posts').run();
  console.log(`✓ Cleared announcements/posts: ${posts.changes}`);

  // 7. Delete all audit logs & notifications
  const audits = db.prepare('DELETE FROM audit_logs').run();
  const notifs = db.prepare('DELETE FROM notifications').run();
  console.log(`✓ Cleared audit logs: ${audits.changes}`);
  console.log(`✓ Cleared notifications: ${notifs.changes}`);

  // 8. Delete timetable entries (so staff can manually arrange their timetable according to their classes)
  const tt = db.prepare('DELETE FROM timetable').run();
  console.log(`✓ Cleared timetable slots: ${tt.changes}`);

  // 9. Delete student class associations and students
  const sc = db.prepare('DELETE FROM student_classes').run();
  const st = db.prepare('DELETE FROM students').run();
  const stUsers = db.prepare("DELETE FROM users WHERE role = 'STUDENT'").run();
  console.log(`✓ Cleared student_classes: ${sc.changes}`);
  console.log(`✓ Cleared students table: ${st.changes}`);
  console.log(`✓ Cleared student user accounts: ${stUsers.changes}`);

  db.exec('COMMIT;');
  console.log('\n======================================================');
  console.log(' DATABASE CLEANSED SUCCESSFULLY!');
  console.log(' All demo details removed. System is ready for manual entry.');
  console.log('======================================================');
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('Failed to clean database:', err);
  process.exit(1);
}
