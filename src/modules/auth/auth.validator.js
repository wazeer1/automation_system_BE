'use strict';

const Joi = require('joi');
const { email, password, username, name } = require('../../validators/common.validator');

const registerSchema = Joi.object({
  email: email.required(),
  password: password.required(),
  firstName: name.required(),
  lastName: name.required(),
  username: username.required(),
  phone: Joi.string().optional().allow(''),
});

const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: email.required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: password.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: password.required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

const resendVerificationSchema = Joi.object({
  email: email.required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  resendVerificationSchema,
};
