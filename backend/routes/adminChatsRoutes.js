const express = require('express');
const router = express.Router();

// GET /api/admin/chats/unread — получить новые чаты (заглушка)
router.get('/unread', (req, res) => {
  res.json([]);
});

// GET /api/admin/chats — получить все чаты (заглушка)
router.get('/', (req, res) => {
  res.json([]);
});

module.exports = router;
