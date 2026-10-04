const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { initSchema } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (usually port 5173 or 5174)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure DB is initialized
initSchema();

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    system: 'College Attendance Management System (CAMS) 2026',
    engine: 'Node.js Express + SQLite'
  });
});

// Route Mounts
app.use('/api/auth', require('./routes/auth'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/dean', require('./routes/dean'));
app.use('/api/hod', require('./routes/hod'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/students', require('./routes/students'));
app.use('/api/academics', require('./routes/academics'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/hackathons', require('./routes/hackathons'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/presence', require('./routes/presence'));
app.use('/api/od', require('./routes/od'));
app.use('/api/corrections', require('./routes/corrections'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/audit-logs', require('./routes/audit'));
app.use('/api/notifications', require('./routes/notifications'));

// Serve client production build
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
const fs = require('node:fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Global 404 handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// SPA fallback for non-API client routes
if (fs.existsSync(clientDistPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎓 College Attendance System Server Running on Port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🕒 Server Time: ${new Date().toISOString()}`);
  console.log(`=======================================================`);
});

module.exports = app;
