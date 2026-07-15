require('dotenv').config();

module.exports = {
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '12h',
  refreshTokenExpiresIn: '7d',

  // Rate Limiting
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 5, // 5 attempts

  // Password
  bcryptSaltRounds: 10,
  minPasswordLength: 6,

  // Cookie
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieSameSite: 'strict',
  cookieHttpOnly: true,

  // Session
  sessionSecret: process.env.SESSION_SECRET,

  // CORS
  corsOrigins: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000']
};
