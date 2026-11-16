'use strict';

require('dotenv').config();

const mailConfig = {
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  from: {
    name: process.env.EMAIL_FROM_NAME || 'GreenLight',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@greenlight.com',
  },

  pool: true,
  maxConnections: 5,
  maxMessages: 100,
};

module.exports = mailConfig;
