var express = require('express');
var router = express.Router();
const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017";
const { checkAuth, isAdmin } = require('../middlewares/auth');
const { ObjectId } = require("mongodb"); // 記得引入 ObjectId

// 取得所有已註冊用戶的清單
router.get('/', checkAuth, isAdmin, async function(req, res, next) {
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
   res.render('usersList', { users: userList });   
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "無法讀取用戶列表" });
  } finally {
    await client.close();
  }
});

module.exports = router;
