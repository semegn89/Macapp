const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// Создать заявку
router.post('/', async (req, res) => {
  try {
    const reqDoc = new Request(req.body);
    await reqDoc.save();
    res.json({ success: true, request: reqDoc });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка создания заявки' });
  }
});

// Получить все заявки (для админа)
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка запроса заявок' });
  }
});

// Обновить статус заявки
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, request: updated });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

module.exports = router;