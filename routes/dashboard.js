const express = require("express");
const moment = require("moment");
const striptags = require("striptags");
const firebaseDb = require("../connections/firebase_admin");
// const convertPagination = require('../modules/pagination');
const firebaseSort = require("../modules/firebaseSort");
const firebaseAdminDb = require("../connections/firebase_admin");

const router = express.Router();
const categoriesPath = "/categories/";
const categoriesRef = firebaseDb.ref(categoriesPath);
const articlesPath = "/articles/";
const articlesRef = firebaseDb.ref(articlesPath);
const tagsPath = "/tags/";
const tagsRef = firebaseDb.ref(tagsPath);
const convertPagination = require('../modules/pagination');

router.get("/", (req, res) => {
  const messages = req.flash("error");
  res.render("dashboard/index", {
    title: "Express",
    currentPath: "/",
    hasErrors: messages.length > 0,
    currentRoute: req.path,
    sessionId: req.session.uid
  });
});

// -------------------文章管理-----------------------------------------
//文章管理頁面顯示
router.get("/archives/", (req, res) => {
  const currentPage = Number.parseInt(req.query.page) || 1;
  const status = req.query.status || "public";
  let categories = {};
  categoriesRef
    .once("value")
    .then((snapshot) => {
      categories = snapshot.val();
      return articlesRef.orderByChild("update_time").once("value");
    })
    .then((snapshot) => {
      const articles = [];
      snapshot.forEach((snapshotChild) => {
        if (status === snapshotChild.val().status) {
          articles.push(snapshotChild.val());
        }
      });
      articles.reverse();
      const paginatedArticles = convertPagination(articles, currentPage);
      res.render("dashboard/archives", {
        title: "Express",
        articles: paginatedArticles.data,
        pagination: paginatedArticles.page,
        categories,
        moment,
        striptags,
        status,
        currentRoute: req.path,
        sessionId: req.session.uid,
        url: 'dashboard/archives'
      });
    });
});

// -------------------文章-----------------------------------------
//新增文章頁面(顯示)
router.get("/article", (req, res) => {
  const messages = req.flash("error");
  categoriesRef.once("value").then((snapshot) => {
    const categories = snapshot.val();
    res.render("dashboard/article", {
      title: "Express",
      currentPath: "/article/create",
      categories,
      messages,
      hasErrors: messages.length > 0,
      currentRoute: req.path,
      sessionId: req.session.uid
    });
  });
});

//編輯文章頁面(顯示單一筆資料)
router.get("/article/:id", (req, res) => {
  const messages = req.flash("error");
  const id = req.param("id");
  let categories = {};
  categoriesRef
    .once("value")
    .then((snapshot) => {
      categories = snapshot.val();
      return articlesRef.child(id).once("value");
    })
    .then((snapshot) => {
      const article = snapshot.val();
      res.render("dashboard/article", {
        title: "Express",
        currentPath: "/article/",
        article,
        messages,
        categories,
        hasErrors: messages.length > 0,
        currentRoute: req.path,
        sessionId: req.session.uid
      });
    });
});

//文章創建
// Post
router.post("/article/create", (req, res) => {
  const articleRef = articlesRef.push();
  const key = articleRef.key;
  const updateTime = Math.floor(Date.now() / 1000);
  const data = req.body;
  data.id = key;
  data.update_time = updateTime;
  articleRef.set(data).then(() => {
    res.redirect(`/dashboard/article/${key}`);
  });
});

// 更新文章
router.post("/article/update/:id", (req, res) => {
  const data = req.body;
  const id = req.param("id");
  articlesRef
    .child(id)
    .update(data)
    .then(() => {
      res.redirect(`/dashboard/article/${id}`);
    });
});

// 刪除文章
router.delete("/article/:id", (req, res) => {
  const id = req.param("id");
  articlesRef
    .child(id)
    .remove()
    .then(() => {
      res.send({
        success: true,
        url: "/dashboard/archives/public",
      });
      res.end();
    });
});

// ---------------------分類管理---------------------------------------
// 分類管理頁面(顯示)
router.get("/categories", (req, res) => {
  const messages = req.flash("info");
  categoriesRef.once("value").then((snapshot) => {
    const categories = snapshot.val();
    res.render("dashboard/categories", {
      title: "Express",
      categories,
      // currentPath: '/categories/',
      messages,
      hasErrors: messages.length > 0,
      currentRoute: req.path,
      sessionId: req.session.uid
    });
  });
});

router.get("/tags", (req, res) => {
  res.render("dashboard/tags", { title: "Express" });
});


// 分類管理頁面(新增)
router.post("/categories/create", (req, res) => {
  const { name, path } = req.body;

  if (!name || !path) {
    req.flash("info", "欄位不得為空");
    return res.redirect("/dashboard/categories");
  }

  // 检查名称是否存在
  const nameCheck = categoriesRef
      .orderByChild("name")
      .equalTo(name)
      .once("value");

  // 检查路径是否存在
  const pathCheck = categoriesRef
      .orderByChild("path")
      .equalTo(path)
      .once("value");

  Promise.all([nameCheck, pathCheck])
      .then(([nameSnapshot, pathSnapshot]) => {
        if (nameSnapshot.val() !== null) {
          req.flash("info", "已有相同的名稱");
          return res.redirect("/dashboard/categories");
        }

        if (pathSnapshot.val() !== null) {
          req.flash("info", "已有相同的路徑");
          return res.redirect("/dashboard/categories");
        }

        const categoryRef = categoriesRef.push();
        const key = categoryRef.key;
        const data = { id: key, name, path };

        return categoryRef.set(data).then(() => {
          res.redirect("/dashboard/categories");
        });
      })
      .catch((err) => {
        console.error("Error checking duplicates:", err);
        req.flash("error", "系統錯誤，請稍後再試");
        res.redirect("/dashboard/categories");
      });
});

//分類管理頁面(刪除)
router.post("/categories/delete/:id", (req, res) => {
  const id = req.param("id");
  categoriesRef.child(id).remove();
  req.flash("info", "欄位已經被刪除");
  res.redirect("/dashboard/categories");
  res.end();
});

module.exports = router;
