const jwt = require('jsonwebtoken');
const JWT_SECRET = "t51515615611565656";

// 1. 第一層關卡：檢查有沒有登入 (驗證 Token)
function checkAuth(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const token = req.cookies.token;
  
  if (!token) {
    // return res.status(401).send("請先登入！");
    res.status(401);
req.flash('error', '請先登入帳號！');
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // 把解密後的用戶資料（id, username, role）掛在 req 上，傳給下一個 function
    next();             // 順利過關，放行！
  } catch (err) {
    res.clearCookie('token');
    return res.status(403).send("登入憑證失效，請重新登入");
  }
}

// 2. 第二層關卡：檢查是否為管理員 (選用，之後會很方便)
function isAdmin(req, res, next) {
  // 這個中間件必須接在 checkAuth 後面，因為要有 req.user 才能判斷
  if (req.user && req.user.role === 'admin') {
    next(); // 是 admin，放行！
  } else {
    res.status(403).send("權限不足！只有管理員可以查看此頁面。");
  }
}

// 將這兩個工具匯出
module.exports = {
  checkAuth,
  isAdmin
};