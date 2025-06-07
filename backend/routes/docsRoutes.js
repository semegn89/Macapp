const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file.filename });
});

router.get('/:filename', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../uploads/', req.params.filename));
});

module.exports = router;