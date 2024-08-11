const express = require('express');
const moment = require('moment');
const striptags = require('striptags');
const firebaseDb = require('../connections/firebase_admin');
const convertPagination = require('../modules/pagination');
const firebaseSort = require('../modules/firebaseSort');
const errorPage = require('../modules/errorPage');

const router = express.Router();
const categoriesPath = '/categories/';
const categoriesRef = firebaseDb.ref(categoriesPath);
const articlesPath = '/articles/';
const articlesRef = firebaseDb.ref(articlesPath);

// 前台首頁
router.get('/', (req, res) => {
  const currentPage = Number.parseInt(req.query.page) || 1;
  let categories = {};

  categoriesRef.once('value').then((snapshot) => {
    categories = snapshot.val();
    return articlesRef.orderByChild('update_time').once('value');
  }).then((snapshot) => {
    const sortData = firebaseSort.byDate(snapshot, 'status', 'public');
    const articles = convertPagination(sortData, currentPage);
    res.render('index', {
      title: 'Express',
      categoryId: null,
      articles: articles.data,
      pagination: articles.page,
      categories,
      striptags, // 去除 HTML 標籤套件
      moment, // 時間套件,
      sessionId: req.session.uid,
      url:''
    });
  });
});

// 前台文章頁面
router.get('/post/:id', (req, res) => {
  const id = req.param('id');
  let categories = {};
  categoriesRef.once('value').then((snapshot) => {
    categories = snapshot.val();
    return articlesRef.child(id).once('value');
  }).then((snapshot) => {
    const article = snapshot.val();
    if (!article) {
      return errorPage(res, '找不到該文章');
    }
    res.render('post', {
      title: 'Express',
      categoryId: null,
      article,
      categories,
      moment, // 時間套件
      sessionId: req.session.uid
    });
  });
});

module.exports = router;
