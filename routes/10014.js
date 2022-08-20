
const assert = require('assert');
const util = require('./util');
const Promise = require('promise');
const session = require('../session/session');

// 喜欢、取消喜欢
function post10014(req, res, db) {
    if (req.body.contentId && req.body.token) {
        const contentId = parseInt(req.body.contentId)
        const token = req.body.token;
        console.log(`receive param contentId is ${contentId}, token is ${token}`);

        var uid = -1;

        session.getData(token).then((cacheData) => {
            uid = cacheData.uid;
            console.log(`get data from token success, uid is ${uid}`);
            return getContent(contentId, db);
        }).then((content) => {
            return checkFavor(contentId, uid, db, content);
        }).then((isFavor) => {
            console.log(`check favor complete, isFavor is ${isFavor}`);

            util.end(0, isFavor ? '喜欢成功' : '取消喜欢成功', {'isFavor': isFavor}, res, db);
        });
    } else {
        util.end(3, '请传入参数：诗文id', {}, res, db);
    }
}

// 从content中获取title, author
function getContent(contentId, db) {
    console.log(`get content at ${contentId}.`);

    return new Promise((resolve, reject) => {
        db.collection('content').aggregate([{$match: {id: contentId}}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$lookup: {localField: "dynasty_id", from: "dynasty", foreignField: "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$project: {name:1, "authorInfo.name":1, "dynastyInfo.name":1}}]).toArray((err, docs) => {
            assert.equal(err, null);

            var content = {}

            if (docs.length > 0) {
                var doc = docs[0];
                content.title = doc.name;
                content.author = doc.authorInfo.name;
                content.dynasty = doc.dynastyInfo.name;
            }
            console.log(`get content is ${content}`);

            resolve(content);
        });
    });
}

// 根据uid和contentId，从喜欢表中查询，如果查询不到，表明没有喜欢，生成一项数据，如果查询到，说明已喜欢，删除该项，取消喜欢
// 返回数据表明操作后，是否喜欢
function checkFavor(contentId, uid, db, content) {
    console.log(`check favor for ${uid} at ${contentId}.`);

    return new Promise((resolve, reject) => {
        db.collection('favor').find({'content_id': contentId, 'uid': uid}, {'_id': 1}).toArray((err, docs) => {
            assert.equal(err, null);

            if (docs.length > 0) {
                // 已喜欢，删除本条记录
                console.log(`${uid} already favor at ${contentId}, delete this favor record.`);

                var id = docs[0]._id;
                db.collection('favor').remove({'_id': id});
                
                // 是否喜欢
                resolve(false);
            } else {
                // 未喜欢，生成一条点赞记录
                console.log(`${uid} has not favor at ${contentId}, generate favor record.`);

                var timestamp = new Date().getTime();
                db.collection('favor').insert({'content_id': contentId, 'uid': uid, 'create_time': timestamp, 'title': content.title, 'author': content.author});

                // 是否喜欢
                resolve(true);
            }
        });
    });
}

module.exports.post10014 = post10014;
