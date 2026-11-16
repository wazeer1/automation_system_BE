'use strict';

module.exports = {
  router: require('./user.routes'),
  service: require('./user.service'),
  repository: require('./user.repository'),
  controller: require('./user.controller'),
  events: require('./user.events'),
  socket: require('./user.socket'),
  constants: require('./user.constants'),
};
