
const assert = require('assert');
const util = require('./util');

/**
1. 从request中获取朝代id
2. 从作者列表查找该朝代对应的作者，并按姓名排序
3. 对每一个作者的通用操作
   4.1 获取id和姓名
   4.1 查询他所处的朝代名
   4.2 查询他的作品数量
算法级别：O(N)
*/

function post10012(req, res, db) {
    var dynastyId = parseInt(req.body.dynastyId);
    console.log(`request id ${dynastyId}`);

    // 初始化数据
    var data = {};
    data.authors = [];

    var author = db.collection('author');

    getAuthorsByDynasty(author, res, data, db, dynastyId);
}

function getAuthorsByDynasty(author, res, data, db, dynastyId) {
    author.find({'dynasty_id':dynastyId}, {'id': 1, 'name': 1, 'namepy':1, 'dynasty': 1, 'count': 1, 'avatar': 1}).sort({'namepy':1}).toArray((err, docs) => {
        assert.equal(err, null);
        console.log(`get authors by dynasty_id complete, size: ${docs.length}`);

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

module.exports.post10012 = post10012;
