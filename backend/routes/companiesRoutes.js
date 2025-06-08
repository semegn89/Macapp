const express = require('express');
const router = express.Router();

// GET — получить список компаний (заглушка)
router.get('/', (req, res) => {
  res.json([]);
});

module.exports = router;