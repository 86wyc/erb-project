const { body, validationResult } = require('express-validator');

const validateLogin = [
  body('account')
    .trim()
    .notEmpty().withMessage('請輸入帳號或電子郵件')
    .isString().withMessage('無效的帳號格式')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9@._-]+$/)
    .escape(),
  body('password')
    .trim()
    .notEmpty().withMessage('請輸入密碼')
    .isString().withMessage('無效的密碼格式')
    .isLength({ min: 6 })
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.status(400).render('login', { 
      errorMessage: errors.array()[0].msg 
    });
  }
  next();
};

module.exports = {
  validateLogin,
  checkValidation
};