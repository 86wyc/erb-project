var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const session = require('express-session');
const flash = require('connect-flash');

// 啟用 Session 中間件
app.use(session({
  secret: 'tcm_session_secret',
  resave: false,
  saveUninitialized: true
}));

// 啟用 Flash 中間件
app.use(flash());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var indexRouter = require('./routes/index');


app.use('/', indexRouter);
app.use('/userInfo', require('./routes/userInfo'));
app.use('/admin', require('./routes/admin'));
app.use('/consult', require('./routes/consult'));
app.use('/register', require('./routes/register'));
app.use('/changePassword', require('./routes/changePassword'));
app.use('/login', require('./routes/login'));




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
