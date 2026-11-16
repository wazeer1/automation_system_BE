'use strict';

const nodemailer = require('nodemailer');
const { mail: mailConfig } = require('../config');
const logger = require('./logger.helper');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: {
        user: mailConfig.auth.user,
        pass: mailConfig.auth.pass,
      },
      pool: mailConfig.pool,
      maxConnections: mailConfig.maxConnections,
      maxMessages: mailConfig.maxMessages,
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html, text, attachments = [] }) => {
  const info = await getTransporter().sendMail({
    from: `"${mailConfig.from.name}" <${mailConfig.from.address}>`,
    to,
    subject,
    html,
    text,
    attachments,
  });
  logger.info('Email sent', { messageId: info.messageId, to, subject });
  return info;
};

const sendVerificationEmail = (to, token, name) => {
  const url = `${process.env.APP_URL}/api/v1/auth/verify-email?token=${token}`;
  return sendMail({
    to,
    subject: 'Verify your email address',
    html: `
      <h2>Hello ${name},</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${url}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

const sendPasswordResetEmail = (to, token, name) => {
  const url = `${process.env.APP_URL}/reset-password?token=${token}`;
  return sendMail({
    to,
    subject: 'Reset your password',
    html: `
      <h2>Hello ${name},</h2>
      <p>You requested a password reset. Click the button below:</p>
      <a href="${url}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p>This link expires in 60 minutes. If you didn't request this, ignore this email.</p>
    `,
  });
};

const sendOtpEmail = (to, otp, name) =>
  sendMail({
    to,
    subject: 'Your verification code',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:8px;font-size:48px;color:#4F46E5;">${otp}</h1>
      <p>This code expires in 10 minutes.</p>
    `,
  });

module.exports = {
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
};
