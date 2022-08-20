
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const router = express.Router();

// connection url
const url = 'mongodb://root:asdffdsa@115.159.121.209:27017/poem';

const post10001 = require('./10001');
const post10002 = require('./10002');
const post10003 = require('./10003');
const post10004 = require('./10004');
const post10005 = require('./10005');
const post10006 = require('./10006');
const post10007 = require('./10007');
const post10008 = require('./10008');
const post10009 = require('./10009');
const post10010 = require('./10010');
const post10011 = require('./10011');
const post10012 = require('./10012');
const post10014 = require('./10014');
const post10015 = require('./10015');
const post10016 = require('./10016');
const post10017 = require('./10017');
const post10018 = require('./10018');

const session = require('../session/session')

// 保存数据库引用
var db = null;

// 连接到router上的每一个请求，都要先执行本中间件，用于连接数据库
router.use(function (req, res, next) {
    console.log('start connect mongodb');
    MongoClient.connect(url, (err, mongodb) => {
        if (null == err) {
            console.log('connected successfully to mongo server');
            db = mongodb;
            next();
        } else {
            console.log('connect fail to mongo server');
            db = null;
            next('connect fail to mongo server');
        }
    });
});

// 登录
router.post('/10000', function(req, res) {
    console.log(`receive post10000 after conenct mongodb server`);
    session.login(req, res, db);
});

// 获取书籍列表
router.use('/10001', function(req, res) {
    console.log('receive post10001 after conenct mongodb server');
    post10001.post10001(req, res, db);
});

// 获取作者列表
router.post('/10002', function(req, res) {
    console.log('receive post10002 after conenct mongodb server');
    post10002.post10002(req, res, db);
});

// 获取朝代列表
router.post('/10003', function(req, res) {
    console.log('receive post10003 after conenct mongodb server');
    post10003.post10003(req, res, db);
});

// 获取主题和tag列表
router.post('/10004', function(req, res) {
    console.log('receive post10004 after conenct mongodb server');
    post10004.post10004(req, res, db);
});

// 获取诗集目录和文章列表
router.post('/10005', function(req, res) {
    console.log('receive post10005 after conenct mongodb server');
    post10005.post10005(req, res, db);
});

// 获取诗文详情
router.post('/10006', function(req, res) {
    console.log('receive post10006 after conenct mongodb server');
    post10006.post10006(req, res, db);
});

// 获取作者详情
router.post('/10007', function(req, res) {
    console.log('receive post10007 after conenct mongodb server');
    post10007.post10007(req, res, db);
});

// 获取朝代详情
router.post('/10008', function(req, res) {
    console.log('receive post10008 after conenct mongodb server');
    post10008.post10008(req, res, db);
});

// 获取标签详情
router.post('/10009', function(req, res) {
    console.log('receive post10009 after conenct mongodb server');
    post10009.post10009(req, res, db);
});

// 搜索
router.post('/10010', function(req, res) {
    console.log('receive post10010 after conenct mongodb server');
    post10010.post10010(req, res, db);
});

// 点赞
router.post('/10011', function(req, res) {
    console.log('receive post10011 after conenct mongodb server');
    post10011.post10011(req, res, db);
});

// 查找朝代对应作者列表
router.post('/10012', function(req, res) {
    console.log('receive post10012 after conenct mongodb server');
    post10012.post10012(req, res, db);
});

// 保存用户信息
router.post('/10013', function(req, res) {
    console.log(`receive post10013 after conenct mongodb server`);
    session.saveUserInfo(req, res, db);
});

// 喜欢或取消喜欢
router.post('/10014', function(req, res) {
    console.log(`receive post10014 after conenct mongodb server`);
    post10014.post10014(req, res, db);
});

// 获取用户对作品的点赞、喜欢信息
router.post('/10015', function(req, res) {
    console.log(`receive post10015 after conenct mongodb server`);
    post10015.post10015(req, res, db);
});

// 存储评论
router.post('/10016', function(req, res) {
    console.log(`receive post10016 after conenct mongodb server`);
    post10016.post10016(req, res, db);
});

// 获取一级评论列表
router.post('/10017', function(req, res) {
    console.log(`receive post10017 after conenct mongodb server`);
    post10017.post10017(req, res, db);
});

// 获取用户喜欢的作品列表
router.post('/10018', function(req, res) {
    console.log(`receive post10018 after conenct mongodb server`);
    post10018.post10018(req, res, db);
});

module.exports = router;
