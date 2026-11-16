// 'use strict';

// const cors = require('cors');
// const { app: appConfig } = require('../config');

// const corsOptions = {
//   origin: (origin, callback) => {
//     // Allow server-to-server requests (no origin) and whitelisted origins
//     if (!origin || appConfig.cors.origin.includes(origin) || appConfig.cors.origin.includes('*')) {
//       callback(null, true);
//     } else {
//       callback(new Error(`CORS: origin ${origin} is not allowed`));
//     }
//   },
//   credentials: appConfig.cors.credentials,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-tenant-id'],
//   exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
//   maxAge: 86400, // 24h preflight cache
// };

// module.exports = cors(corsOptions);


'use strict';

const cors = require('cors');
const { app: appConfig } = require('../config');

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow server-to-server requests (no origin, e.g., Postman/curl)
    // 2. If appConfig dictates allowing everything, or it's a localhost request, or explicit whitelist match
    if (
      !origin ||
      appConfig.cors.origin.includes('*') ||
      origin.startsWith('http://localhost:') ||
      origin === 'http://localhost' ||
      appConfig.cors.origin.includes(origin)
    ) {
      // Echo back the origin instead of '*' to comply with credentials: true
      callback(null, origin || '*');
    } else {
      callback(new Error(`CORS: origin ${origin} is not allowed`));
    }
  },
  credentials: appConfig.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-tenant-id'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  maxAge: 86400, // 24h preflight cache
};

module.exports = cors(corsOptions);