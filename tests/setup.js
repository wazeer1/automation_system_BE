'use strict';

require('dotenv').config({ path: '.env.test' });

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_32_chars_minimum_length';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32_chars_minimum_length';
process.env.LOG_LEVEL = 'error';

// Silence console in tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
