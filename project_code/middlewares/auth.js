require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "t51515615611565656";

function checkAuth(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const token = req.cookies.token;

  if (!token) {
    res.status(401);
    req.flash('error', '請先登入帳號！');
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    req.flash('error', '登入憑證失效，請重新登入');
    return res.redirect("/login");
  }
}

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    req.flash('error', '權限不足！只有管理員可以查看該頁面。');
    return res.redirect("/");
  }
}

module.exports = {
  checkAuth,
  isAdmin
};
