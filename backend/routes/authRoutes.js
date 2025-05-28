const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
    res.send('Регистрация будет тут');
});

module.exports = router;
const express = require('express');
const router = express.Router();

// ✅ Тестовый роут
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Auth route is working!' });
});

module.exports = router;
