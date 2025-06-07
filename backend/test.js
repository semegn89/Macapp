// backend/test.js
console.log('Тест пошёл!');
const { sendMail } = require('./utils/mailer');
sendMail({
  to: 'mail@frsgroupe.com', // сюда впиши свою почту для проверки!
  subject: 'Тестовое письмо',
  html: '<b>Проверка отправки писем!</b>'
})
  .then(() => console.log('Письмо отправлено!'))
  .catch(console.error);