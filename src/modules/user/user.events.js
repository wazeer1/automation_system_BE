'use strict';

const EventEmitter = require('events');

const userEventEmitter = new EventEmitter();
userEventEmitter.setMaxListeners(20);

const emitUserEvent = (event, data) => userEventEmitter.emit(event, data);

module.exports = { userEventEmitter, emitUserEvent };
