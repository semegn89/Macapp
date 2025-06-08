const express = require('express');
const router = express.Router();

let currentRates = {
  USD: 90, EUR: 98, CNY: 12, GBP: 115, AED: 25, RUB: 1
};

router.get('/', (req, res) => {
  res.json(currentRates);
});

router.post('/', (req, res) => {
  currentRates = { ...currentRates, ...req.body.rates };
  res.json({ success: true, message: 'Курсы обновлены', rates: currentRates });
});

module.exports = router; // <-- только так!
