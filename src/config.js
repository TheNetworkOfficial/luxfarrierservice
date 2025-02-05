// src/config.js
const isProduction = process.env.NODE_ENV === 'production';

export const API_BASE_URL = isProduction
  ? ''
  : 'http://localhost:3000';
