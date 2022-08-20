
const assert = require('assert');
const util = require('./util');
const Promise = require('promise');
const session = require('../session/session');

// 添加普通评论
function post10016(req, res, db) {
    if (req.body.contentId && req.body.token && req.body.comment) {
        const contentId = parseInt(req.body.contentId)
        const token = req.body.token;
        const comment = req.body.comment;
        console.log(`receive param contentId is ${contentId}, token is ${token}, comment is ${comment}`);

        session.getData(token).then((cacheData) => {
            var uid = cacheData.uid;
            console.log(`get data from token success, uid is ${uid}`);
            return getCommenterInfo(uid, db);
        }).then((userInfo) => {
            console.log(userInfo);

            return saveComment(userInfo, comment, contentId, db);
        }).then((result) => {
            return increaseCommentCount(contentId, db, result);
        }).then((result) => {
            util.end(0, '评论成功', result, res, db);
        });
    } else {
        util.end(3, '请传入参数：诗文id', {}, res, db);
    }
}

// 获取评论者信息
function getCommenterInfo(uid, db) {
    console.log(`get commenter info for ${uid}`);

    return new Promise((resolve, reject) => {
        db.collection('user').find({'uid': uid}, {'nick_name': 1, 'avatar': 1}).toArray((err, docs) => {
            assert.equal(err, null);

            if (docs.length > 0) {
                console.log(`get user info fro ${uid}, info is: `);
                console.log(docs[0]);

                var info = {};
                info.nickName = docs[0].nick_name;
                info.avatar = docs[0].avatar;
                info.uid = uid;

                resolve(info);
            }
        });
    });
}

// 生成评论记录，返回记录内容
function saveComment(userInfo, comment, contentId, db) {
    console.log(`save comment ${comment}`);

    return new Promise((resolve, reject) => {
        // 保存评论
        var timestamp = new Date().getTime();
        db.collection('comment').insert({
            'content': comment, 
            'content_id': contentId, 
            'create_time': timestamp, 
            'from_uid': userInfo.uid, 
            'from_user_name': userInfo.nickName, 
            'from_user_avatar': userInfo.avatar,
            'thumb': 0,
            'comment_id': '',
            'to_uid': -1,
            'to_user_name': '',
            'to_user_avatar': '',
            'reply_count': 0
        });
        console.log('save complete');

        // 获取评论信息并返回
        db.collection('comment').find({'content_id': contentId, 'from_uid': userInfo.uid, 'create_time': timestamp}, {'_id': 1}).toArray((err, docs) => {
            assert.equal(err, null);

            if (docs.length > 0) {
                var commentId = docs[0]._id;

                var result = {};
                result.comment_id = commentId;
                result.create_time = timestamp;
                result.comment = comment;
                result.commenter_name = userInfo.nickName;
                result.commenter_avatar = userInfo.avatar;
                console.log(result);

                resolve(result);
            }
        });
    });
}

// 作品评论数加1
function increaseCommentCount(contentId, db, result) {
    console.log(`increase comment count for ${contentId}`);

    return new Promise((resolve, reject) => {
        db.collection('content').find({id: contentId}, {'comment_count': 1}).toArray((err, docs) => {
            assert.equal(err, null);

            var commentCount = 0;
            if (docs.length > 0) {
                commentCount = parseInt(docs[0].comment_count) + 1;
            }
            console.log(`new comment count for ${contentId} is ${commentCount}`);

            db.collection('content').update({'id': contentId}, {$set: {'comment_count': commentCount}});

            resolve(result);
        });
    });
}

module.exports.post10016 = post10016;
