'use strict';

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { storage: storageConfig } = require('../config');
const { ValidationError } = require('../exceptions');

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, storageConfig.local.path),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const memoryStorage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (storageConfig.limits.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage: storageConfig.driver === 'local' ? diskStorage : memoryStorage,
  fileFilter,
  limits: { fileSize: storageConfig.limits.maxFileSize },
});

module.exports = { upload };
