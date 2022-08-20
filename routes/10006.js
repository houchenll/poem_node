
const assert = require('assert');
const util = require('./util');
const Promise = require('promise');

function post10006(req, res, db) {

    if (req.body.contentId) {
        const contentId = parseInt(req.body.contentId)
        console.log(`receive param contentId is ${contentId}`);

        getContent(contentId, db).then((result) => {
            util.end(0, 'get content', result, res, db)
        });
    } else {
        util.end(3, '请传入参数：诗文id', {}, res, db)
    }

}

// 获取内容详情
function getContent(contentId, db) {
    console.log(`get content for ${contentId}`);

    return new Promise((resolve, reject) => {
        db.collection('content').aggregate([{$match: {id: contentId}}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$lookup: {localField: "dynasty_id", from: "dynasty", foreignField: "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$lookup: {localField: "menu_id", from: "menu", foreignField: "id", as: "menuInfo"}}, {$unwind: "$menuInfo"}, {$lookup: {localField: "book_id", from: "book", foreignField: "id", as: "bookInfo"}}, {$unwind: "$bookInfo"}, {$lookup: {localField: "type_id", from: "type", foreignField: "id", as: "typeInfo"}}, {$unwind: "$typeInfo"}, {$lookup: {localField: "category_id", from: "category", foreignField: "id", as: "categoryInfo"}}, {$unwind: "$categoryInfo"}, {$project: {id:1, title:1, sub_title:1, cipai:1, name:1, author_id:1, dynasty_id:1, "authorInfo.name":1, "dynastyInfo.name":1, preface:1, content:1, translate:1, annotation:1, appreciation:1, background:1, genre:1, tag:1, "menuInfo.name":1, "bookInfo.name":1, "typeInfo.name":1, "categoryInfo.name":1, reads:1, star:1, images:1, thumb_up:1, 'comment_count':1}}]).toArray((err, docs) => {
            assert.equal(err, null)
            console.log(docs)

            var data = {}

            if (docs.length > 0) {
                var doc = docs[0]
                data.id = doc.id
                data.title = doc.name
                data.subTitle = doc.sub_title
                data.cipai = doc.cipai
                data.authorName = doc.authorInfo.name
                data.dynastyName = doc.dynastyInfo.name
                data.authorId = doc.author_id
                data.dynastyId = doc.dynasty_id
                data.preface = doc.preface
                data.content = doc.content
                data.translate = doc.translate
                data.notes = doc.annotation
                data.appr = doc.appreciation
                data.background = doc.background
                data.genre = doc.genre
                data.tags = doc.tag
                data.menu = doc.menuInfo.name
                data.book = doc.bookInfo.name
                data.type = doc.typeInfo.name
                data.category = doc.categoryInfo.name
                data.reads = doc.reads
                data.star = doc.star
                data.images = doc.images
                data.thumbUp = doc.thumb_up
                data.commentCount = doc.comment_count
            }

            // 阅读数加1，修改sort_id，并更新
            var newReads = parseInt(data.reads) + 1;
            var sortId = 74300000000 * parseInt(data.star) + 78000000000 * parseInt(data.thumbUp) + 52000000000 * parseInt(data.reads) + 260000000000 - parseInt(data.id)
            db.collection('content').update({id: contentId}, {$set: {reads: newReads, sort_id: sortId}});
            data.reads = newReads;

            resolve(data);
        })
    });
}

module.exports.post10006 = post10006;
