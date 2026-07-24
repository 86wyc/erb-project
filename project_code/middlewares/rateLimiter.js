const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    req.flash('error', '嘗試次數過多，請15分鐘後再試');
    return res.status(429).render('login', {
      errorMessage: '嘗試次數過多，請15分鐘後再試'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: '請求過於頻繁，請稍後再試'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  apiLimiter
};