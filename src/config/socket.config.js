'use strict';

require('dotenv').config();

const appConfig = require('./app.config');

const socketConfig = {
  cors: {
    origin: appConfig.cors.origin,
    methods: ['GET', 'POST'],
    credentials: appConfig.cors.credentials,
  },

  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],

  namespaces: {
    default: '/',
    notifications: '/notifications',
    presence: '/presence',
    chat: '/chat',
  },

  adapter: {
    pubSubClient: null, // Attach redis adapter in server.js if needed
  },
};

module.exports = socketConfig;
