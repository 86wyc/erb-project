var express = require('express');
var router = express.Router();
const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017";
const { checkAuth, isAdmin } = require('../middlewares/auth');
const { ObjectId } = require("mongodb"); // 記得引入 ObjectId

// 取得所有已註冊用戶的清單
router.get('/', checkAuth, isAdmin, async function (req, res, next) {
  const client = new MongoClient(uri);

  try {
    const database = client.db('tcm');
    const usersCollection = database.collection("users");

    // 撈取所有用戶，並依註冊時間倒序排列（最新註冊的在最前面）
    // 使用 .project() 排除密碼欄位 (password: 0)
    const userList = await usersCollection.find()
      .sort({ createdAt: -1 })
      .project({ password: 0 })
      .toArray();

    // 回傳 JSON 給前端
    res.render('admin', { users: userList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "無法讀取用戶列表" });
  } finally {
    await client.close();
  }
});

// 🚀 新增：處理後台管理員即時修改 User 資料的路由
router.post('/update-user', async function (req, res, next) {
  // 這裡強烈建議你也要加上 isAdmin 中間件防護，避免別人繞過前端直接打這個 API

  const client = new MongoClient(uri);
  const database = client.db('tcm');
  const usersCollection = database.collection("users");

  try {
    const { id, username, email, role, phone } = req.body;

    // 基本後端驗證 (防止空值)
    if (!username || !email || !role || !phone) {
      return res.json({ success: false, message: '所有欄位皆為必填！' });
    }

    // 香港電話格式檢查 (跟註冊一樣)
    const hkPhoneRegex = /^[2356789]\d{7}$/;
    if (!hkPhoneRegex.test(phone)) {
      return res.json({ success: false, message: '請輸入合法的 8 位數香港電話號碼！' });
    }

    // 執行資料庫更新
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) }, // 將字串 id 轉成 MongoDB 的 ObjectId
      {
        $set: {
          username: username,
          email: email,
          role: role, // 'user' 或 'admin'
          phone: phone
        }
      }
    );

    if (result.modifiedCount === 1 || result.matchedCount === 1) {
      return res.json({ success: true, message: '更新成功！' });
    } else {
      return res.json({ success: false, message: '找不到該用戶或資料未變更。' });
    }

  } catch (error) {
    console.error("更新用戶失敗:", error);
    return res.json({ success: false, message: '伺服器出錯，請稍後再試。' });
  } finally {
    await client.close();
  }
});

module.exports = router;
