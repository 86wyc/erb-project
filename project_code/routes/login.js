const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { MongoClient } = require("mongodb");
const jwt = require('jsonwebtoken');
const JWT_SECRET = "t51515615611565656";

const uri = "mongodb://localhost:27017";

// GET: 顯示登入頁面 (http://localhost:3000/login)
router.get('/', function(req, res, next) {
  
const successFlash = req.flash('success');
  const successMessage = successFlash.length > 0 ? successFlash[0] : null;

  // 2. 取出錯誤訊息 (攔截未登入產生的)
  const errorFlash = req.flash('error');
  const errorMessage = errorFlash.length > 0 ? errorFlash[0] : null;
res.render('login', { 
    successMessage: successMessage,
    errorMessage: errorMessage // 👈 這樣不管是密碼打錯、還是未登入被踢回，都能用這個變數顯示
  });

});

// POST: 處理登入驗證
router.post('/', async function(req, res, next) {
  const client = new MongoClient(uri);
  
  try {
    const { account, password } = req.body;

    // 欄位檢查
    if (!account || !password) {
      return res.status(400).send("請輸入帳號與密碼");
    }

    const database = client.db('tcm');
    const usersCollection = database.collection("users");

    // 1. 尋找使用者：檢查 username 或 email 是否符合輸入的 account
    const user = await usersCollection.findOne({
      $or: [
        { username: account },
        { email: account }
      ]
    });

    // 如果找不到該用戶
    if (!user) {
        return res.status(401).render('login', { errorMessage: "帳號或密碼錯誤（找不到此用戶）" });  
  }

    // 2. 比對密碼：使用 bcrypt.compare 比對明文密碼與資料庫中的加密密碼
    // 第一個參數：前端傳來的明文密碼 (password)
    // 第二個參數：資料庫存的加密密碼 (user.password)
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
        return res.status(401).render('login', { errorMessage: "帳號或密碼錯誤（密碼不正確）" });  
  }

// 3. 登入成功：製作 Token (包含 id, username, role)
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' } // Token 1 小時後過期
    );

    // 4. 將 Token 存入 Cookie，並導向他該去的頁面
    res.cookie('token', token, { httpOnly: true });

    // 3. 登入成功後的動作
    // 實務上這裡會把用戶資訊寫入 Session 或產生 Token
    // 目前先直接幫使用者導向到你的用戶清單頁面
// ─── 關鍵修改：根據權限角色分流引導 (Role-Based Redirect) ───
if (user.role === 'admin') {
  // 如果是管理員，直接導向管理後台（看所有用戶清單）
  res.redirect("/usersList"); 
} else {
  // 如果是一般會員，導向他自己的個人資料中心
  res.redirect("/userInfo"); 
}

  } catch (error) {
    console.error(error);
    res.status(500).send("伺服器出錯，請稍後再試");
  } finally {
    await client.close();
  }
});

// GET: 處理登出請求 (網址為 /login/logout)
router.get('/logout', function(req, res, next) {
  // 1. 清除瀏覽器中名為 'token' 的 Cookie
  res.clearCookie('token');
  
  // 2. 利用 flash 塞入登出成功訊息
  req.flash('success', '您已登出。');
  
  // 3. 導向登入頁面
  res.redirect('/login');
})

module.exports = router;