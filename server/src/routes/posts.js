const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/posts - Get posts tailored to user's role and department
router.get('/', authenticateToken, (req, res) => {
  try {
    const userRole = req.user.role;
    const userDeptId = req.user.departmentId;

    // Fetch all posts with author metadata
    const allPosts = db.prepare(`
      SELECT p.*, u.avatar_url, d.name as department_name, d.code as department_code, d.category as department_category
      FROM posts p
      JOIN users u ON u.id = p.author_id
      LEFT JOIN departments d ON d.id = p.department_id
      ORDER BY p.created_at DESC
    `).all();

    // Categorize into the requested streams:
    // 1. College Public Posts
    const collegePublic = allPosts.filter(p => p.scope === 'COLLEGE_PUBLIC');

    // 2. Dean Cluster Directives (Posts by Dean overseeing this cluster)
    const deanPosts = allPosts.filter(p => p.scope === 'DEAN_CLUSTER' || p.author_role === 'DEAN');

    // 3. Department HOD Posts (Seen only by this department)
    const departmentHodPosts = allPosts.filter(p => 
      p.scope === 'DEPARTMENT_ONLY' && (p.department_id === userDeptId || userRole === 'ADMINISTRATOR' || userRole === 'SUPER_ADMIN')
    );

    // 4. Other Department News (Department News from other departments)
    const departmentNews = allPosts.filter(p => 
      p.scope === 'DEPARTMENT_NEWS' || (p.scope === 'DEPARTMENT_ONLY' && p.department_id !== userDeptId)
    );

    res.json({
      collegePublic,
      deanPosts,
      departmentHodPosts,
      departmentNews,
      all: allPosts
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// POST /api/posts - Create an announcement/post (Dean, HOD, Administrator)
router.post('/', authenticateToken, requireRoles('DEAN', 'HOD', 'ADMINISTRATOR', 'SUPER_ADMIN'), (req, res) => {
  const { title, content, scope, tag, target_cluster, department_id } = req.body;

  if (!title || !content || !scope) {
    return res.status(400).json({ error: 'Title, content, and scope are required' });
  }

  try {
    let deptId = null;
    if (scope === 'DEPARTMENT_ONLY' || scope === 'DEPARTMENT_NEWS') {
      deptId = req.user.departmentId || department_id || 1;
    }

    const stmt = db.prepare(`
      INSERT INTO posts (author_id, author_name, author_role, department_id, scope, target_cluster, title, content, tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      req.user.name,
      req.user.role,
      deptId,
      scope,
      target_cluster || 'ALL',
      title,
      content,
      tag || 'General'
    );

    res.status(201).json({
      message: 'Post published successfully',
      postId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

module.exports = router;
