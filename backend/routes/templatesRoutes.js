const express = require('express');
const router = express.Router();

// GET — получить список шаблонов (заглушка)
router.get('/', (req, res) => {
  res.json([]);
});

module.exports = router;