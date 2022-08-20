
const assert = require('assert');
const util = require('./util');
const Promise = require('promise');
const session = require('../session/session');

// 是否喜欢、点赞了
function post10015(req, res, db) {
    if (req.body.contentId && req.body.token) {
        const contentId = parseInt(req.body.contentId)
        const token = req.body.token;
        console.log(`receive param contentId is ${contentId}, token is ${token}`);

        var uid = -1;
        var isFavor = false;

        session.getData(token).then((cacheData) => {
            uid = cacheData.uid;
            console.log(`get data from token success, uid is ${uid}`);
            return checkFavor(contentId, uid, db);
        }).then((favorValue) => {
            isFavor = favorValue;
            return checkThumb(contentId, uid, db);
        }).then((thumbValue) => {
            var result = {};
            result.isFavor = isFavor;
            result.isThumb = thumbValue;
            console.log(`get user content info result is ${result}`);
            console.log(result);

            util.end(0, '获取用户作品信息成功', result, res, db);
        });
    } else {
        util.end(3, '请传入参数：诗文id', {}, res, db);
    }
}

// 根据uid和contentId，从喜欢表中查询，如果查询不到，表明没有喜欢，返回false，如果查询到，说明已喜欢，返回true
// 返回数据表明操作后，是否喜欢
function checkFavor(contentId, uid, db) {
    console.log(`check favor for ${uid} at ${contentId}.`);

    return new Promise((resolve, reject) => {
        db.collection('favor').find({'content_id': contentId, 'uid': uid}, {'_id': 1}).toArray((err, docs) => {
            assert.equal(err, null);

            if (docs.length > 0) {
                // 已喜欢，删除本条记录
                console.log(`${uid} already favor at ${contentId}`);
                // 是否喜欢
                resolve(true);
            } else {
                // 未喜欢，生成一条点赞记录
                console.log(`${uid} has not favor at ${contentId}`);
                // 是否喜欢
                resolve(false);
            }
        });
    });
}

// 根据uid和contentId，从点赞表中查询，如果查询不到，表明没有点过赞，返回false, 如果查询到，说明点过赞，返回true
function checkThumb(contentId, uid, db) {
    console.log(`check thumb up for ${uid} at ${contentId}.`);

    return new Promise((resolve, reject) => {
        db.collection('thumb').find({'content_id': contentId, 'uid': uid}, {'_id': 1}).toArray((err, docs) => {
            assert.equal(err, null);

            if (docs.length > 0) {
                // 已点过赞
                console.log(`${uid} already thumb up at ${contentId}`);
                resolve(true);
            } else {
                // 未点过赞
                console.log(`${uid} has not thumb up at ${contentId}`);
                resolve(false);
            }
        });
    });
}

module.exports.post10015 = post10015;
