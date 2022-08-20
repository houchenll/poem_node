
const assert = require('assert');
const util = require('./util');
const Promise = require('promise');
const session = require('../session/session');

// 获取用户喜欢作品列表
function post10018(req, res, db) {
    if (req.body.token) {
        const token = req.body.token;
        console.log(`receive param token is ${token}`);

        session.getData(token).then((cacheData) => {
            if (cacheData == null) {
                util.end(2, 'token失效', {}, res, db);
            }

            var uid = cacheData.uid;
            return getFavorList(uid, db);
        }).then((favors) => {
            util.end(0, '用户喜欢的作品列表', favors, res, db);
        });
    } else {
        util.end(3, '请传入参数：token', {}, res, db);
    }
}

// 获取喜欢作品列表，按时间倒序
function getFavorList(uid, db) {
    console.log(`get favor list for ${uid}`);

    return new Promise((resolve, reject) => {
        db.collection('favor').find({'uid': uid}, {'content_id': 1, 'author': 1, 'dynasty': 1, 'title': 1, 'create_time': 1}).sort({'create_time':-1}).toArray((err, docs) => {
            assert.equal(err, null);

            var favors = [];
            console.log(docs);
            console.log(docs.length);

            for (var i = 0; i < docs.length; i++) {
                var doc = docs[i];

                var item = {};
                item.contentId = doc.content_id;
                item.name = doc.title;
                item.author = doc.author;
                item.dynasty = doc.dynasty;
                item.timestamp = doc.create_time;

                console.log(`append item ${i} with ${item}`);
                console.log(item);

                favors.append(item);
            }

            resolve(favors);
        });
    });
}

module.exports.post10018 = post10018;
