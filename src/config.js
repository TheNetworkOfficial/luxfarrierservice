// src/config.js
const isProduction = process.env.NODE_ENV === 'production';

export const API_BASE_URL = isProduction
  ? 'https://api.luxfarrierservice.com'
  : 'http://localhost:3000';
