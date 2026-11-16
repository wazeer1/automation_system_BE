'use strict';

const { Server } = require('socket.io');
const { socket: socketConfig } = require('../config');
const { registerNamespaces } = require('./namespaces');
const logger = require('../helpers/logger.helper');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: socketConfig.cors,
    pingTimeout: socketConfig.pingTimeout,
    pingInterval: socketConfig.pingInterval,
    transports: socketConfig.transports,
  });

  registerNamespaces(io);

  logger.info('Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
  }
  return io;
};

module.exports = { initSocket, getIO };
