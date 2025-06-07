const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'sm16.hosting.reg.ru',
  port: 465, // или 587 если не сработает
  secure: true, // true для 465, false для 587
  auth: {
    user: 'mail@eurpay.ru',
    pass: 'Eurpay01062025!!'
  }
});

exports.sendMail = async function({ to, subject, html }) {
  return transporter.sendMail({
    from: '"EUROPAY" <mail@eurpay.ru>',
    to,
    subject,
    html
  });
};