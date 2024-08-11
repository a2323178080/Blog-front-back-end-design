const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session')
const dashboard = require('./routes/dashboard');
//路由相關
const indexRouter = require('./routes/index');
const auth = require('./routes/auth');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const app = express();

//套件相關
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}))
app.use(flash());
app.use(cookieParser());

const authChecker = (req, res, next) => {
  if (req.session.uid) {
    return next();
  }
  return res.redirect('/auth/signin');
};

app.use('/', indexRouter);
app.use('/dashboard', dashboard);
app.use('/auth', auth);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs',require('express-ejs-extend'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
