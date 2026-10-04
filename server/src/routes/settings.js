const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/settings - Retrieve all settings
router.get('/', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM attendance_settings ORDER BY id ASC`).all();
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.setting_key] = {
        value: r.setting_value,
        description: r.description
      };
    });
    res.json({
      settings: settingsMap,
      raw: rows
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update settings (Admin only)
router.put('/', authenticateToken, requireRoles('SUPER_ADMIN'), (req, res) => {
  const { settings } = req.body; // e.g. { late_allowance_minutes: "5", minimum_attendance_percent: "75", ... }

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object required' });
  }

  try {
    const updateStmt = db.prepare(`
      INSERT INTO attendance_settings (setting_key, setting_value, description)
      VALUES (?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value
    `);

    const oldRows = db.prepare(`SELECT setting_key, setting_value FROM attendance_settings`).all();
    const oldMap = {};
    oldRows.forEach(r => { oldMap[r.setting_key] = r.setting_value; });

    for (const [key, value] of Object.entries(settings)) {
      updateStmt.run(key, String(value), '');
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, entity, entity_id, user_id, user_name, user_role, old_values, new_values, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'UPDATE_SETTINGS',
      'attendance_settings',
      1,
      req.user.id,
      req.user.name,
      req.user.role,
      JSON.stringify(oldMap),
      JSON.stringify(settings),
      'Super Admin updated institutional attendance rules and policy configuration'
    );

    res.json({ message: 'Attendance settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
