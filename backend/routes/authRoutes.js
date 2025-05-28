const express = require('express');
const router = express.Router();

// ✅ Тестовый маршрут
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Auth route is working!' });
});

module.exports = router;
