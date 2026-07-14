const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // 引入加密套件

const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017";

// 渲染註冊頁面（現在不需要處理 errorMessage flash 了，因為前端會自己處理）
router.get('/', function (req, res, next) {
  res.render('register');
});

// 處理註冊的 POST 請求（改為 API 形式）
router.post('/', async function (req, res, next) {
  const client = new MongoClient(uri);
  try {
    const database = client.db('tcm');
    const usersCollection = database.collection("users");

    console.log("前端傳來的資料：", req.body);
    const { username, email, password, confirmPassword, age, gender, height, weight, phone, realname } = req.body;

    // 基本欄位檢查
    if (!username || !email || !password || !confirmPassword || !age || !gender || !height || !weight || !phone || !realname) {
      return res.status(400).json({ success: false, message: '註冊失敗：所有欄位皆為必填！' });
    }

    // 密碼一致性檢查
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: '註冊失敗：兩次輸入的密碼不一致！' });
    }

    // 後端密碼強度檢查：長度
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: '註冊失敗：密碼長度至少需要 8 個字元！' });
    }

    // 後端密碼強度檢查：大小寫英文
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    if (!hasUpperCase || !hasLowerCase) {
      return res.status(400).json({ success: false, message: '註冊失敗：密碼必須同時包含英文大小寫字母！' });
    }

    // 數值與型態轉換檢查
    const numAge = Number(age);
    const numHeight = Number(height);
    const numWeight = Number(weight);
    if (username.length < 3 || username.length > 15) {
      return res.status(400).json({ success: false, message: '註冊失敗：用戶名長度必須在 3 至 15 個字元之間！' });
    }
    if (numAge < 18 || numAge > 100) {
      return res.status(400).json({ success: false, message: '註冊失敗：年齡必須在 18 至 100 歲之間！' });
    }
    if (numHeight < 130 || numHeight > 200) {
      return res.status(400).json({ success: false, message: '註冊失敗：身高不能小過 130 cm 及 超過 200 cm！' });
    }
    if (numWeight < 20 || numWeight > 300) {
      return res.status(400).json({ success: false, message: '註冊失敗：體重不能少過 20 kg 及 超過 300 kg！' });
    }

    // 香港電話格式檢查 (8位數字)
    const hkPhoneRegex = /^[2356789]\d{7}$/;
    if (!hkPhoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: '註冊失敗：請輸入合法的 8 位數香港電話號碼！' });
    }

    if (realname.length < 2 || realname.length > 4) {
      return res.status(400).json({ success: false, message: '註冊失敗：真實姓名不能少於 2 個字 及 超過 4 個字' });
    }

    // 1. 檢查 username 或 email 是否已被註冊
    const existingUser = await usersCollection.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ success: false, message: '註冊失敗：此用戶名已被使用！' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ success: false, message: '註冊失敗：此 Email 已被註冊！' });
      }
    }

    // 2. 密碼加密
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. 準備存入資料庫的資料物件
    const newUser = {
      username: username,
      email: email,
      password: hashedPassword,
      role: 'user',
      age: numAge,
      gender: gender,
      height: numHeight,
      weight: numWeight,
      phone: phone,
      createdAt: new Date(),
      realname: realname
    };

    // 4. 寫入資料庫
    await usersCollection.insertOne(newUser);

    // 如果成功，回傳成功 JSON，並由前端控制跳轉
    return res.status(200).json({ success: true, message: '註冊成功！將為您導向登入頁面...' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: '註冊失敗：伺服器出錯，請稍後再試' });
  } finally {
    await client.close();
  }
});

module.exports = router;