'use strict';

const { storage: storageConfig } = require('../../config');

// Lazy-load AWS SDK only when S3 driver is active
let S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand;

class S3Adapter {
  constructor() {
    this.bucket = storageConfig.s3.bucket;
    this.region = storageConfig.s3.region;
    this.baseUrl = storageConfig.s3.baseUrl;
    this._client = null;
  }

  _getClient() {
    if (!this._client) {
      const { S3Client: _S3Client, PutObjectCommand: _Put, DeleteObjectCommand: _Del } = require('@aws-sdk/client-s3');
      S3Client = _S3Client;
      PutObjectCommand = _Put;
      DeleteObjectCommand = _Del;

      this._client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: storageConfig.s3.accessKeyId,
          secretAccessKey: storageConfig.s3.secretAccessKey,
        },
      });
    }
    return this._client;
  }

  async upload(file, folder = 'uploads') {
    const { v4: uuidv4 } = require('uuid');
    const path = require('path');
    const ext = path.extname(file.originalname || '').toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;

    await this._getClient().send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return {
      url: `${this.baseUrl}/${key}`,
      key,
      filename: path.basename(key),
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async delete(key) {
    await this._getClient().send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }

  async getSignedUrl(key, expiresIn = storageConfig.s3.signedUrlExpires) {
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const { GetObjectCommand: _Get } = require('@aws-sdk/client-s3');
    return getSignedUrl(this._getClient(), new _Get({ Bucket: this.bucket, Key: key }), { expiresIn });
  }
}

module.exports = new S3Adapter();
