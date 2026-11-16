'use strict';

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { storage: storageConfig } = require('../../config');

class LocalAdapter {
  constructor() {
    this.basePath = path.resolve(storageConfig.local.path);
    this.baseUrl = storageConfig.local.baseUrl;
  }

  async upload(file, folder = 'uploads') {
    const dir = path.join(this.basePath, folder);
    await fs.mkdir(dir, { recursive: true });

    const ext = path.extname(file.originalname || '').toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(dir, filename);

    await fs.writeFile(filePath, file.buffer || await fs.readFile(file.path));

    return {
      url: `${this.baseUrl}/${folder}/${filename}`,
      key: `${folder}/${filename}`,
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async delete(key) {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may already be gone
    }
  }

  async getSignedUrl(key) {
    return `${this.baseUrl}/${key}`;
  }
}

module.exports = new LocalAdapter();
