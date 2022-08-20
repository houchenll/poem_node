
const assert = require('assert');
const util = require('./util');
const Promise = require('promise');
const session = require('../session/session');

// 点赞
function post10011(req, res, db) {
    if (req.body.contentId && req.body.token) {
        const contentId = parseInt(req.body.contentId)
        const token = req.body.token;
        console.log(`receive param contentId is ${contentId}, token is ${token}`);

        var uid = -1;

        session.getData(token)
        .then((cacheData) => {
            uid = cacheData.uid;
            console.log(`get data from token success, uid is ${uid}`);
            return getContent(contentId, db);
        }).then((content) => {
            return checkThumb(contentId, uid, db, content);
        }).then((result) => {
            util.end(0, '点赞或取消点赞成功', result, res, db);
        });
    } else {
        util.end(3, '请传入参数：诗文id', {}, res, db);
    }
}

// 从content中获取title, author, thumbUp
function getContent(contentId, db) {
    console.log(`get content at ${contentId}.`);

    return new Promise((resolve, reject) => {
        db.collection('content').aggregate([{$match: {id: contentId}}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$project: {name:1, "authorInfo.name":1, 'thumb_up': 1}}]).toArray((err, docs) => {
            assert.equal(err, null);

            var content = {}

            if (docs.length > 0) {
                var doc = docs[0];
                content.title = doc.name;
                content.thumbUp = doc.thumb_up;
                content.author = doc.authorInfo.name;
            }
            console.log(`get content is: `);
            console.log(content);

            resolve(content);
        });
    });
}

// 根据uid和contentId，从点赞表中查询，如果查询不到，表明没有点过赞，生成一项数据，如果查询到，说明点过赞，删除该项
function checkThumb(contentId, uid, db, content) {
    console.log(`check thumb up for ${uid} at ${contentId}.`);

    return new Promise((resolve, reject) => {
        db.collection('thumb').find({'content_id': contentId, 'uid': uid}, {'_id': 1}).toArray((err, docs) => {
            assert.equal(err, null);

            var newThumb = 0;

            if (docs.length > 0) {
                // 已点过赞，删除本条记录
                console.log(`${uid} already thumb up at ${contentId}, delete this thumb up record.`);
                var id = docs[0]._id;
                db.collection('thumb').remove({'_id': id});

                // 点赞数减1
                newThumb = parseInt(content.thumbUp) - 1;
                db.collection('content').update({id: contentId}, {$set: {thumb_up: newThumb}});
                
                // 用户是否在这篇作品上点赞了
                var result = {};
                result.isThumb = false;
                result.thumbUp = newThumb;
                console.log(`${uid} check thumb result is: `);
                console.log(result);

                resolve(result);
            } else {
                // 未点过赞，生成一条点赞记录
                console.log(`${uid} has not thumb up at ${contentId}, generate thumb up record.`);
                var timestamp = new Date().getTime();
                db.collection('thumb').insert({'content_id': contentId, 'uid': uid, 'create_time': timestamp, 'title': content.title, 'author': content.author, 'comment_id': ''});

                // 点赞数加1
                newThumb = parseInt(content.thumbUp) + 1;
                db.collection('content').update({id: contentId}, {$set: {thumb_up: newThumb}});

                // 用户是否在这篇作品上点赞了
                var result = {};
                result.isThumb = true;
                result.thumbUp = newThumb;
                console.log(`${uid} check thumb result is: `);
                console.log(result);

                resolve(result);
            }
        });
    });
}

module.exports.post10011 = post10011;
