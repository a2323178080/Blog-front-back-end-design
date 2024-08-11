const express = require('express');
const firebaseClient = require('../connections/firebase_connect');

const router = express.Router();

// 註冊頁面
router.get('/signup', (req, res) => {
  const messages = req.flash('error');
  res.render('dashboard/signup', {
    messages,
    hasErrors: messages.length > 0,
    currentRoute: req.path,
    sessionId: req.session.uid
  });
});

// 註冊
router.post('/signup', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirm_password;
  if (password !== confirmPassword) {
    req.flash('error', '兩個密碼輸入不符合');
    res.redirect('/auth/signup');
  }
  firebaseClient.auth().createUserWithEmailAndPassword(email, password)
      .then((user) => {
        res.redirect('/dashboard');
      })
      .catch((error) => {
        req.flash('error', error.message);
        res.redirect('/auth/signup');
      });
});

// 登入頁面
router.get('/signin', (req, res) => {
  const messages = req.flash('error');
  res.render('dashboard/signin', {
    messages,
    hasErrors: messages.length > 0,
    currentRoute: req.path,
    sessionId: req.session.uid
  });
});

// 登入
router.post('/signin', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  firebaseClient.auth().signInWithEmailAndPassword(email, password)
      .then((user) => {
        req.session.uid = user.uid;
        req.session.mail = req.body.email;
        res.redirect('/dashboard');
      })
      .catch((error) => {
        req.flash('error', error.message);
        res.redirect('/auth/signin');
      });
});

// 登出
router.get('/signout', (req, res) => {
  req.session.uid = '';
  res.redirect('/auth/signin');
});

module.exports = router;
