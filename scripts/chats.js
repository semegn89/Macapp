// chats.js

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
// Разрешаем кросс-доменные запросы
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",        // Подставьте конкретный домен в проде
    methods: ["GET","POST"]
  }
});

// В памяти храним историю чатов по email.
let adminChats = {};

// Обработка WebSocket-соединений
io.on('connection', socket => {
  console.log(`Новый клиент подключен: ${socket.id}`);

  // Клиент просит присоединиться к «комнате» по email
  socket.on('joinChat', userEmail => {
    socket.join(userEmail);
    console.log(`Socket ${socket.id} присоединился к комнате ${userEmail}`);
    // При подключении можно сразу отдать историю сообщений (структурированные объекты)
    if (Array.isArray(adminChats[userEmail])) {
      socket.emit('chatHistory', adminChats[userEmail]);
    }
  });

  // Приход нового сообщения
  socket.on('sendMessage', data => {
    const { userEmail, message } = data;
    if (!userEmail || !message) return;

    // Формируем структурированный объект сообщения:
    // from: 'admin' или 'user', text: строка, timestamp: ISO, read: булево
    const msgObj = {
      from: message.from || 'user', // или 'admin'
      text: message.text || '',
      timestamp: message.timestamp || new Date().toISOString(),
      read: !!message.read
    };

    // Инициализируем массив, если нужно
    if (!adminChats[userEmail]) {
      adminChats[userEmail] = [];
    }
    adminChats[userEmail].push(msgObj);

    // Шлём всем в комнате новое сообщение в виде объекта
    io.to(userEmail).emit('newMessage', msgObj);
  });

  socket.on('disconnect', () => {
    console.log(`Клиент отключился: ${socket.id}`);
  });
});

// REST API на случай, если вы хотите «достать» историю через HTTP
app.get('/chats', (req, res) => {
  // Возвращаем всю историю чатов (по пользователям), где каждое сообщение — объект {from, text, timestamp, read}
  res.json(adminChats);
});

app.post('/chats', (req, res) => {
  const { userEmail, message } = req.body;
  if (!userEmail || !message) {
    return res.status(400).json({ error: 'userEmail и message обязательны' });
  }
  // Формируем структурированный объект сообщения:
  const msgObj = {
    from: message.from || 'user', // или 'admin'
    text: message.text || '',
    timestamp: message.timestamp || new Date().toISOString(),
    read: !!message.read
  };
  if (!adminChats[userEmail]) {
    adminChats[userEmail] = [];
  }
  adminChats[userEmail].push(msgObj);
  // также пушим через сокеты, если кто-то в комнате:
  io.to(userEmail).emit('newMessage', msgObj);
  res.status(201).json({ status: 'OK' });
});

// Запускаем сервер
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chat-сервер запущен на порту ${PORT}`);
});