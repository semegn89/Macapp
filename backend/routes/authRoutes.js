const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
    res.send('Регистрация будет тут');
});

module.exports = router;
