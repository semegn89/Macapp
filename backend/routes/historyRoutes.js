const express = require('express');
const router = express.Router();

// GET — получить архив курсов (заглушка)
router.get('/', (req, res) => {
  res.json({ history: [] });
});

// POST — сохранить архив курсов (заглушка)
router.post('/', (req, res) => {
  res.json({ success: true });
});

module.exports = router;