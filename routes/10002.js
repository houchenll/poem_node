
const assert = require('assert');
const util = require('./util');

/**
1. 从request中获取类型type
2. 若type为0，按时间(id)排序
   2.1 查询作者列表，并按时间(id)排序
   4
3. 若type为1，按姓名排序
   3.1 查询作者列表，并按姓名排序
   4
4. 对每一个作者的通用操作
   4.1 获取id和姓名
   4.1 查询他所处的朝代名
   4.2 查询他的作品数量
算法级别：O(N)
*/

function post10002(req, res, db) {
    var type = 0;
    var bodyType = parseInt(req.body.type);
    if (bodyType == 0 || bodyType == 1)
        type = bodyType;
    console.log(`request type ${type}`);

    // 初始化数据
    var data = {};
    data.authors = [];

    var author = db.collection('author');

    // 获取作者列表，分别按出生日期和姓名排序
    if (type == 0)
        sortByBirth(author, res, data, db);
    else
        sortByName(author, res, data, db);
}

function sortByBirth(author, res, data, db) {
    author.find({}, {'id': 1, 'name': 1, 'namepy':1, 'dynasty': 1, 'count': 1, 'avatar': 1}).sort({'id':1}).toArray((err, docs) => {
        assert.equal(err, null);
        console.log(`get authors by birth complete, size: ${docs.length}`);

        getAuthorInfo(docs, res, data, db);
    });
}

function sortByName(author, res, data, db) {
    author.find({}, {'id': 1, 'name': 1, 'namepy':1, 'dynasty': 1, 'count': 1, 'avatar': 1}).sort({'namepy':1}).toArray((err, docs) => {
        assert.equal(err, null);
        console.log(`get authors by name complete, size: ${docs.length}`);

        getAuthorInfo(docs, res, data, db);
    });
}

// 遍历作者列表，获取每个作者的信息，组装，并返回
function getAuthorInfo(docs, res, data, db) {
    for (var i = 0; i < docs.length; i++) {
        var item = {};
        
        item.id = docs[i].id;
        item.name = docs[i].name;
        item.namepy = docs[i].namepy;
        item.dynasty = docs[i].dynasty;
        item.count = docs[i].count;
        item.avatar = docs[i].avatar;
        // console.log(item);

        data.authors.push(item);
    }

    util.end(0, 'author list', data, res, db);
}

module.exports.post10002 = post10002;
