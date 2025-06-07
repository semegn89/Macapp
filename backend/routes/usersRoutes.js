const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Получить всех пользователей (только для админа)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка запроса пользователей' });
  }
});

// Изменить пользователя (админ)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, user: updated });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка обновления пользователя' });
  }
});

module.exports = router;