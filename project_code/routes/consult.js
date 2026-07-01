var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('consult', { title: 'consult' });
});

router.post('/', function (req, res, next) {
  // const { name, email, message } = req.body;
});

module.exports = router;
