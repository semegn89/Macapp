const express = require('express');
const router = express.Router();

router.get('/chats/unread', (req, res) => {
  res.json([]); // Нет новых чатов
});

module.exports = router;