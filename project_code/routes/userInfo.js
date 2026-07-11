var express = require('express');
var router = express.Router();
const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017";

const { checkAuth, isAdmin } = require('../middlewares/auth');
const { ObjectId } = require("mongodb"); // 記得引入 ObjectId


// 2. 個人頁面：只需要「登入」就可以看
router.get('/', checkAuth, async function(req, res, next) {
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

module.exports = router;
