'use strict';

const success = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

const created = (res, data = null, message = 'Created successfully') =>
  success(res, data, message, 201);

const paginated = (res, data, pagination, message = 'Success') =>
  res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });

const error = (res, message = 'Something went wrong', statusCode = 500, code = 'SERVER_ERROR', errors = []) =>
  res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
  });

const noContent = (res) => res.status(204).send();

module.exports = { success, created, paginated, error, noContent };
