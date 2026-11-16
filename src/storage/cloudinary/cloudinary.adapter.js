'use strict';

const cloudinary = require('cloudinary').v2;
const { storage: storageConfig } = require('../../config');

cloudinary.config({
  cloud_name: storageConfig.cloudinary.cloudName,
  api_key: storageConfig.cloudinary.apiKey,
  api_secret: storageConfig.cloudinary.apiSecret,
});

class CloudinaryAdapter {
  async upload(file, folder = 'uploads') {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      key: result.public_id,
      filename: result.original_filename,
      size: result.bytes,
      mimeType: file.mimetype,
    };
  }

  async delete(key) {
    await cloudinary.uploader.destroy(key);
  }

  async getSignedUrl(key) {
    return cloudinary.url(key, { sign_url: true, secure: true });
  }
}

module.exports = new CloudinaryAdapter();
