var express = require('express');
var router = express.Router();
const { MongoClient, ObjectId } = require("mongodb");
const uri = "mongodb://localhost:27017";

// 引入你的登入驗證中間件
const { checkAuth } = require('../middlewares/auth');

// 1. 個人頁面渲染 (保持不變，但確保不傳出密碼)
router.get('/', checkAuth, async function (req, res, next) {
  const client = new MongoClient(uri);
  try {
    const database = client.db('tcm');
    const myData = await database.collection("users").findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );

    if (!myData) return res.status(404).send("找不到用戶資料");

    res.render('userInfo', { user: myData });
  } catch (error) {
    console.error(error);
    res.status(500).send("伺服器出錯");
  } finally {
    await client.close();
  }
});


// 🚀 2. 新增：處理用戶「自己更改資料」的 API 路由
router.post('/update', checkAuth, async function (req, res, next) {
  const client = new MongoClient(uri);
  const database = client.db('tcm');
  const usersCollection = database.collection("users");

  try {
    const { age, gender, height, weight, phone } = req.body;

    // 基本欄位檢查
    if (!age || !gender || !height || !weight || !phone) {
      return res.json({ success: false, message: '更新失敗：所有欄位皆為必填！' });
    }

    // 數值與型態轉換檢查
    const numAge = Number(age);
    const numHeight = Number(height);
    const numWeight = Number(weight);

    // 嚴格比照註冊時的範圍限制
    if (numAge < 18 || numAge > 100) {
      return res.json({ success: false, message: '更新失敗：年齡必須在 18 至 100 歲之間！' });
    }
    if (numHeight < 130 || numHeight > 200) {
      return res.json({ success: false, message: '更新失敗：身高不能小於 130 cm 或超過 200 cm！' });
    }
    if (numWeight < 20 || numWeight > 300) {
      return res.json({ success: false, message: '更新失敗：體重不能少於 20 kg 或超過 300 kg！' });
    }

    // 香港電話格式檢查 (8位數字)
    const hkPhoneRegex = /^[2356789]\d{7}$/;
    if (!hkPhoneRegex.test(phone)) {
      return res.json({ success: false, message: '更新失敗：請輸入合法的 8 位數香港電話號碼！' });
    }

    // 執行資料庫更新（只針對當前登入的 req.user.id）
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.user.id) },
      {
        $set: {
          age: numAge,
          gender: gender,
          height: numHeight,
          weight: numWeight,
          phone: phone
        }
      }
    );

    // 判斷是否成功更新 (modifiedCount 代表實際被改動，matchedCount 代表有找到人但資料相同)
    if (result.matchedCount === 1) {
      return res.json({ success: true, message: '個人資料更新成功！' });
    } else {
      return res.json({ success: false, message: '找不到對應的用戶資料。' });
    }

  } catch (error) {
    console.error("更新個人資料失敗:", error);
    return res.json({ success: false, message: '伺服器出錯，請稍後再試' });
  } finally {
    await client.close();
  }
});

module.exports = router;