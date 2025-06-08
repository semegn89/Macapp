const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailer');

// Универсальный backend URL для формирования ссылок (работает и локально, и на сервере)
const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';

// ——— Мидлвара для админ-эндпоинтов (можно доработать)
function authAdmin(req, res, next) {
  // Пример: авторизация через заголовок (или cookie)
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Нет авторизации' });
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
    req.userId = payload.userId;
    // Получаем пользователя и проверяем роль
    User.findById(payload.userId).then(user => {
      if (user && user.role === 'admin') return next();
      return res.status(403).json({ error: 'Только для админа' });
    });
  } catch (e) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
}

// ——— Регистрация с email-подтверждением
router.post('/register', async (req, res) => {
  try {
    const { email, password, ...profile } = req.body;
    if (!email || !password) {
      console.error('Регистрация: не указан email или пароль');
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    const exist = await User.findOne({ email });
    if (exist) {
      console.error('Регистрация: дубль email', email);
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    console.log('>>> Запрос регистрации:', req.body);
    console.log('>>> FRONTEND_URL:', process.env.FRONTEND_URL);

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash, ...profile, isVerified: false });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '1d' });
    const link = `${frontendUrl}/verify.html?token=${token}`;
    console.log('Регистрация: отправляю письмо на', email, 'с ссылкой:', link);

    try {
      await sendMail({
        to: email,
        subject: 'Подтвердите ваш email в EUROPAY',
        html: `<b>Спасибо за регистрацию!</b><br>Пожалуйста, подтвердите свой e-mail:<br><a href="${link}">${link}</a>`
      });
      console.log('>>> Письмо успешно отправлено на', email, 'с ссылкой:', link);
    } catch (mailErr) {
      console.error('>>> Ошибка отправки письма:', mailErr);
      return res.status(500).json({ error: 'Ошибка при отправке письма. Попробуйте позже.' });
    }

    res.json({ success: true, message: 'Письмо для подтверждения отправлено на почту' });
  } catch (e) {
    const email = req.body?.email;
    console.error('Ошибка регистрации:', e, email ? `Email: ${email}` : '');
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// ——— Подтверждение email
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Нет токена' });
    let userId;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
      userId = payload.userId;
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Неверный или истёкший токен' });
    }
    const user = await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
    if (!user) return res.status(400).json({ success: false, message: 'Пользователь не найден' });
    return res.json({ success: true, message: 'Почта подтверждена! Теперь вы можете войти.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Ошибка подтверждения' });
  }
});

// ——— Вход (только для подтверждённых)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: 'Неверный email или пароль' });
    if (!user.isVerified)
      return res.status(403).json({ error: 'Почта не подтверждена' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });
    res.json({ token, user: { email: user.email, companyName: user.companyName, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ——— Восстановление пароля: отправить письмо
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true }); // Не палим, что нет пользователя

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '30m' });
    const link = `${frontendUrl}/reset-password.html?token=${token}`;
    await sendMail({
      to: email,
      subject: 'Восстановление пароля EUROPAY',
      html: `<b>Восстановление пароля:</b><br>Перейдите по ссылке: <a href="${link}">${link}</a>`
    });
    res.json({ success: true, message: 'Письмо для восстановления отправлено!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка восстановления пароля' });
  }
});

// ——— Сброс пароля по ссылке
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Нет токена или пароля' });
    let userId;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
      userId = payload.userId;
    } catch (e) {
      return res.status(400).json({ error: 'Неверный или истёкший токен' });
    }
    const hash = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(userId, { password: hash });
    res.json({ success: true, message: 'Пароль обновлён!' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сброса пароля' });
  }
});

// ——— Массовая рассылка (админ)
router.post('/broadcast', authAdmin, async (req, res) => {
  const { subject, html } = req.body;
  const users = await User.find({ isVerified: true });
  for (const u of users) {
    await sendMail({
      to: u.email,
      subject,
      html
    });
  }
  res.json({ success: true, message: 'Рассылка отправлена!' });
});

// ——— Подтверждение email (POST-версия для новых клиентов)
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Нет токена' });
    let userId;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
      userId = payload.userId;
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Неверный или истёкший токен' });
    }
    const user = await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
    if (!user) return res.status(400).json({ success: false, message: 'Пользователь не найден' });
    res.json({ success: true, message: 'Почта подтверждена! Теперь вы можете войти.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Ошибка подтверждения' });
  }
});

module.exports = router;
