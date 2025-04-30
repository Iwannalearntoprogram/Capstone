// services/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'imainloli@gmail.com',  // Replace with your email
      pass: 'your-email-password',   // Replace with your email password
    },
  });

  let info = await transporter.sendMail({
    from: '"Your Name" <your-email@gmail.com>',  // Replace with your email
    to: to,
    subject: subject,
    text: text,
  });

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
