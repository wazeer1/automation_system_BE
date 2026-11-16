'use strict';

const { storage: storageConfig } = require('../config');

const getAdapter = () => {
  switch (storageConfig.driver) {
    case 's3':
      return require('./s3/s3.adapter');
    case 'cloudinary':
      return require('./cloudinary/cloudinary.adapter');
    case 'local':
    default:
      return require('./local/local.adapter');
  }
};

const storageService = {
  upload: (file, folder) => getAdapter().upload(file, folder),
  delete: (key) => getAdapter().delete(key),
  getSignedUrl: (key, expiresIn) => getAdapter().getSignedUrl(key, expiresIn),
};

module.exports = storageService;
