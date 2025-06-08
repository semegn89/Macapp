const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// === ВАЖНО: только один раз cors, строго с нужным origin и credentials ===
app.use(cors({
  origin: 'http://192.168.100.152:5500', // <-- твой локальный IP и порт фронта
  credentials: true
}));
app.use(express.json());

// ===== DIAGNOSTICS LOGS (start)
console.log('======= DIAGNOSTICS START =======');
console.log('process.env.PORT:', process.env.PORT);
console.log('process.env.BACKEND_URL:', process.env.BACKEND_URL);
console.log('process.env.FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('process.env.SMTP_HOST:', process.env.SMTP_HOST);
console.log('process.env.SMTP_USER:', process.env.SMTP_USER);
console.log('process.env.MAIL_FROM:', process.env.MAIL_FROM);
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('process.env.MONGODB_URI:', process.env.MONGODB_URI);
console.log('======= DIAGNOSTICS END ========');
// ===== DIAGNOSTICS LOGS (end)

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/payments', require('./routes/paymentsRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/docs', require('./routes/docsRoutes'));

app.get('/', (req, res) => res.json({ message: 'API is running' }));

const PORT = process.env.PORT || 5001;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    // Сервер слушает на всех интерфейсах (IP, localhost)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('Фронтенд будет искать verify.html тут:', process.env.FRONTEND_URL);
    });
  })
  .catch((err) => console.error('MongoDB connect error', err));
