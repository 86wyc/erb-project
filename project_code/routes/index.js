var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {


  const successFlash = req.flash('success');
  const successMessage = successFlash.length > 0 ? successFlash[0] : null;

  // 2. 取出錯誤訊息 (攔截未登入產生的)
  const errorFlash = req.flash('error');
  const errorMessage = errorFlash.length > 0 ? errorFlash[0] : null;

  res.render('index', { successMessage: successMessage, errorMessage: errorMessage });
});

module.exports = router;
