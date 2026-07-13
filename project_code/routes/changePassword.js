const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { MongoClient } = require("mongodb");
const jwt = require('jsonwebtoken');
const JWT_SECRET = "t51515615611565656";

const uri = "mongodb://localhost:27017";

// ─── 1. GET: 顯示修改密碼頁面 ───
router.get('/', function (req, res, next) {
  res.render('changePassword', { errorMessage: null });
});

// ─── 2. POST: 處理修改密碼邏輯 ───
router.post('/', async function (req, res, next) {

  const client = new MongoClient(uri);

  try {
    const { account, oldPassword, newPassword, confirmPassword } = req.body;
    //因為密碼所以用req.flash('error') 令到可以重置input的值
    // 欄位基本檢查
    if (!account || !oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).render('changePassword', { errorMessage: "所有欄位皆為必填！" });
    }

    // ─── 2. 新增：比對兩次輸入的新密碼是否相同 ───
    if (newPassword !== confirmPassword) {
      return res.status(400).render('changePassword', { errorMessage: "修改失敗：兩次輸入的新密碼不一致！" });
    }

    // 新密碼強度篩選 (後端防禦)
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
      return res.status(400).render('changePassword', { errorMessage: "新密碼不符合規範（須 8 碼以上且包含大小寫英文）" });
    }

    const database = client.db('tcm');
    const usersCollection = database.collection("users");

    // 尋找用戶 (透過 username 或 email)
    const user = await usersCollection.findOne({
      $or: [{ username: account }, { email: account }]
    });

    if (!user) {
      return res.status(400).render('changePassword', { errorMessage: "帳號或舊密碼錯誤" });
    }

    // 驗證舊密碼
    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      return res.status(400).render('changePassword', { errorMessage: "帳號或舊密碼錯誤" });
    }

    // 將新密碼加密
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新資料庫中的密碼
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashedNewPassword } }
    );

    // 利用 flash 帶入成功訊息並跳轉回登入頁
    req.flash('success', '密碼修改成功！請使用新密碼登入。');
    res.redirect('/login');

  } catch (error) {
    console.error(error);
    res.status(500).render('changePassword', { errorMessage: "伺服器出錯，請稍後再試" });
  } finally {
    await client.close();
  }
});

module.exports = router;