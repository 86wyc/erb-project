require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { MongoClient } = require("mongodb");
const jwt = require('jsonwebtoken');
const { loginLimiter } = require('../middlewares/rateLimiter');
const JWT_SECRET = process.env.JWT_SECRET || "t51515615611565656";
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

router.get('/', function (req, res, next) {
  const successFlash = req.flash('success');
  const successMessage = successFlash.length > 0 ? successFlash[0] : null;
  const errorFlash = req.flash('error');
  const errorMessage = errorFlash.length > 0 ? errorFlash[0] : null;
  res.render('login', {
    successMessage: successMessage,
    errorMessage: errorMessage
  });
});

router.post('/', loginLimiter, async function (req, res, next) {
  const client = new MongoClient(uri);

  try {
    const { account, password } = req.body;

    if (!account || !password) {
      req.flash('error', '請輸入帳號與密碼');
      return res.status(400).render('login', { errorMessage: '請輸入帳號與密碼' });
    }

    const database = client.db('tcm');
    const usersCollection = database.collection("users");

    const user = await usersCollection.findOne({
      $or: [
        { username: account },
        { email: account }
      ]
    });

    if (!user) {
      req.flash('error', '帳號或密碼錯誤');
      return res.status(401).render('login', { errorMessage: '帳號或密碼錯誤' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      req.flash('error', '帳號或密碼錯誤');
      return res.status(401).render('login', { errorMessage: '帳號或密碼錯誤' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.cookie('token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000
    });

    if (user.role === 'admin') {
      res.redirect("/admin");
    } else {
      res.redirect("/userInfo");
    }

  } catch (error) {
    console.error(error);
    req.flash('error', '伺服器出錯，請稍後再試');
    res.status(500).render('login', { errorMessage: '伺服器出錯，請稍後再試' });
  } finally {
    await client.close();
  }
});

router.get('/logout', function (req, res, next) {
  res.clearCookie('token');
  req.flash('success', '您已登出。');
  res.redirect('/login');
})

module.exports = router;
