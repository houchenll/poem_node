
const assert = require('assert');
const util = require('./util');
const Promise = require('promise');

// 获取一级评论列表
function post10017(req, res, db) {
    if (req.body.contentId) {
        const contentId = parseInt(req.body.contentId)
        console.log(`receive param contentId is ${contentId}`);

        getCommentList(contentId, db).then((result) => {
            util.end(0, '获取评论列表成功', result, res, db);
        });
    } else {
        util.end(3, '请传入参数：诗文id', {}, res, db);
    }
}

// 获取一级评论列表，一级评论的comment_id为空
function getCommentList(contentId, db) {
    console.log(`get comment list for ${contentId}`);

    return new Promise((resolve, reject) => {
        db.collection('comment').find({'content_id': contentId, 'comment_id':''}, {'_id': 1, 'create_time':1, 'content':1, 'from_uid':1, 'from_user_name':1, 'from_user_avatar':1, 'thumb':1, 'reply_count':1}).sort({'create_time':-1}).toArray((err, docs) => {
            assert.equal(err, null);
            console.log(`query comment success, result is ${docs}`);
            console.log(docs);

            var comments = [];

            for (var i = 0; i < docs.length; i++) {
                var comment = {};
                comment.commentId = docs[i]._id;
                comment.createTime = docs[i].create_time;
                comment.comment = docs[i].content;
                comment.fromUid = docs[i].from_uid;
                comment.fromUserName = docs[i].from_user_name;
                comment.fromUserAvatar = docs[i].from_user_avatar;
                comment.thumbCount = docs[i].thumb;
                comment.replyCount = docs[i].reply_count;

                console.log(`comment ${i} is ${comment}`);
                comments.push(comment);
            }

            var result = {};
            result.comments = comments;
            resolve(result);
        });
    });
}

module.exports.post10017 = post10017;
