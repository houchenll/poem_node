const assert = require('assert');
const util = require('./util');

/*
获取作者详情，包括姓名、简介、头像、朝代、作品数量、作品列表。
作品列表以书进行分组，每个作品包括作品id、标题、体裁、阅读数、评级。
*/
function post10007(req, res, db) {

    if (req.body.authorId) {
        var authorId = parseInt(req.body.authorId)

        db.collection('author').find({id: authorId}, {name:1, intro:1, avatar:1, dynasty:1, count:1}).toArray((err, docs) => {
            assert.equal(err, null)

            var data = {}
            data.name = docs[0].name
            data.intro = docs[0].intro
            data.avatar = docs[0].avatar
            data.dynasty = docs[0].dynasty
            data.count = docs[0].count

            getWorks(authorId, db, (works) => {
                data.works = works

                db.close()
                util.end(0, '作者详情', data, res, db)
            })
        })
    } else {
        util.end(3, '请传入参数：作者id', {}, res, db)
    }

}

// 获取作品列表
function getWorks(authorId, db, callback) {

    db.collection('content').aggregate([{$match: {author_id: authorId}}, {$lookup: {localField: "book_id", from: "book", foreignField: "id", as: "bookInfo"}}, {$unwind: "$bookInfo"}, {$project: {id:1, name:1, genre:1, reads:1, star:1, "bookInfo.id":1, "bookInfo.name":1}}, {$sort: {id:1}}]).toArray((err, docs) => {
        assert.equal(err, null)

        var bookId = 0
        var bookName = ''
        var works = []
        var bookContents = []

        for (var i = 0; i < docs.length; i++) {
            // 如果当前book_id不等于前面的book_id，有两种情况，一种是当前是第一本书第一首诗，另一种是当前是另一本书第一首诗
            // 第一种情况，不用做处理，第二种情况，需要重置bookContents列表
            if (docs[i].bookInfo.id != bookId && bookId > 0) {
                var work = {}
                work.bookName = bookName
                work.contents = bookContents
                works.push(work)

                bookContents = []
            }
            bookId = docs[i].bookInfo.id
            bookName = docs[i].bookInfo.name

            var content = {}

            content.contentId = docs[i].id
            content.title = docs[i].name
            content.genre = docs[i].genre
            content.reads = docs[i].reads
            content.star = docs[i].star

            bookContents.push(content)
        }
        var work = {}
        work.bookName = bookName
        work.contents = bookContents
        works.push(work)

        callback(works)
    })

}

module.exports.post10007 = post10007
