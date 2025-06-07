const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// Создать платёж
router.post('/', async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.json({ success: true, payment });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка создания платежа' });
  }
});

// Получить все платежи пользователя
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user; // или вытаскивай из JWT
    const query = userId ? { user: userId } : {};
    const payments = await Payment.find(query).sort({ createdAt: -1 });
    res.json(payments);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка запроса платежей' });
  }
});

// Обновить платёж (например, статус)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, payment: updated });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка обновления платежа' });
  }
});

module.exports = router;