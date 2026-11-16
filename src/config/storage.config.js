'use strict';

require('dotenv').config();

const storageConfig = {
  driver: process.env.STORAGE_DRIVER || 'local', // local | s3 | cloudinary

  local: {
    path: process.env.STORAGE_LOCAL_PATH || 'uploads',
    baseUrl: process.env.APP_URL || 'http://localhost:3000',
  },

  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET,
    baseUrl: process.env.AWS_S3_URL,
    signedUrlExpires: 3600, // seconds
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  limits: {
    maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
};

module.exports = storageConfig;
