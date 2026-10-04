const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/audit-logs - View audit trails
router.get('/', authenticateToken, requireRoles('SUPER_ADMIN', 'HOD'), (req, res) => {
  try {
    let query = `
      SELECT a.*
      FROM audit_logs a
      WHERE 1=1
    `;
    const params = [];

    if (req.query.action) {
      query += ` AND a.action = ?`;
      params.push(req.query.action);
    }

    if (req.query.entity) {
      query += ` AND a.entity = ?`;
      params.push(req.query.entity);
    }

    if (req.query.search) {
      query += ` AND (a.user_name LIKE ? OR a.reason LIKE ? OR a.action LIKE ?)`;
      const term = `%${req.query.search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY a.timestamp DESC LIMIT 100`;

    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
