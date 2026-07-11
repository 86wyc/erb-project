const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // 引入加密套件

const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017";

router.get('/', function (req, res, next) {
  const errorFlash = req.flash('error');
  const errorMessage = errorFlash.length > 0 ? errorFlash[0] : null;

  // 將錯誤訊息傳給 EJS 樣板
  res.render('register', { errorMessage: errorMessage });
});


// 處理註冊的 POST 請求
router.post('/', async function (req, res, next) {
  const client = new MongoClient(uri);
  const database = client.db('tcm'); // 你可以換成 'my_app' 等自訂資料庫名
  const usersCollection = database.collection("users");
  try {
    console.log("前端傳來的資料：", req.body); // 👈 加這行，重啟伺服器，看看終端機印出來的欄位名對不對！
    const { username, email, password, confirmPassword, age, gender, height, weight, phone } = req.body;
    // 基本欄位檢查
    // 基本欄位檢查
    if (!username || !email || !password || !confirmPassword || !age || !gender || !height || !weight || !phone) {
      req.flash('error', '註冊失敗：所有欄位皆為必填！');
      return res.redirect('/register');
    }

    // 密碼一致性檢查
    if (password !== confirmPassword) {
      req.flash('error', '註冊失敗：兩次輸入的密碼不一致！');
      return res.redirect('/register');
    }

    // 後端密碼強度檢查：長度
    if (password.length < 8) {
      req.flash('error', '註冊失敗：密碼長度至少需要 8 個字元！');
      return res.redirect('/register');
    }

    // 後端密碼強度檢查：大小寫英文
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    if (!hasUpperCase || !hasLowerCase) {
      req.flash('error', '註冊失敗：密碼必須同時包含英文大小寫字母！');
      return res.redirect('/register');
    }

    // 數值與型態轉換檢查
    const numAge = Number(age);
    const numHeight = Number(height);
    const numWeight = Number(weight);

    if (numAge < 18 || numAge > 100) {
      req.flash('error', '註冊失敗：年齡必須在 18 至 100 歲之間！');
      return res.redirect('/register');
    }
    if (numHeight <= 130 || numHeight > 200) {
      req.flash('error', '註冊失敗：身高不能超過 200 cm！');
      return res.redirect('/register');
    }
    if (numWeight <= 20 || numWeight > 300) {
      req.flash('error', '註冊失敗：體重不能超過 300 kg！');
      return res.redirect('/register');
    }

    // 香港電話格式檢查 (8位數字)
    const hkPhoneRegex = /^[2356789]\d{7}$/;
    if (!hkPhoneRegex.test(phone)) {
      req.flash('error', '註冊失敗：請輸入合法的 8 位數香港電話號碼！');
      return res.redirect('/register');
    }


    // 1. 檢查 username 或 email 是否已被註冊
    // 使用 $or 條件同時搜查兩個欄位
    const existingUser = await usersCollection.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        req.flash('error', '註冊失敗：此用戶名已被使用！');
        return res.redirect('/register');
      }
      if (existingUser.email === email) {
        req.flash('error', '註冊失敗：此 Email 已被註冊！');
        return res.redirect('/register');
      }
    }

    // 2. 密碼加密 (Salt rounds 設為 10 即可)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. 準備存入資料庫的資料物件（進行型態轉換）
    const newUser = {
      username: username,
      email: email,
      password: hashedPassword,
      role: 'user',
      age: Number(age),          // 轉成數字
      gender: gender,            // 字串 (男/女)
      height: Number(height),    // 轉成數字
      weight: Number(weight),    // 轉成數字
      phone: phone,              // 字串
      createdAt: new Date()
    };

    // 4. 寫入資料庫
    await usersCollection.insertOne(newUser);
    req.flash('success', '註冊成功！請登入。'); // 先把訊息塞進 flash
    res.redirect("/login");

  } catch (error) {
    console.error(error);
    req.flash('error', '註冊失敗：伺服器出錯，請稍後再試');
    res.redirect('/register');
  } finally {
    await client.close();
  }
});

module.exports = router;