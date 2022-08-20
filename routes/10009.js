const assert = require('assert');
const util = require('./util');

function post10009(req, res, db) {

    var data = {}

    if (req.body.tag) {
        var tagName = req.body.tag
        
        searchTagInfo(db, res, tagName, data)
    } else {
        util.end(3, '请传入参数: 关键词', data, res, db)
    }

}

function searchTagInfo(db, res, tagName, data) {
    console.log(`开始在查询标签${tagName}详情`)

    db.collection('tag').find({name: tagName}, {'intro': 1, 'image': 1, 'count':1}).toArray((err, docs) => {
        assert.equal(err, null)

        var size = docs.length
        if (size > 0) {
            var doc = docs[0]
            data.name = tagName
            data.intro = doc.intro
            data.image = doc.image
            data.count = doc.count
            searchTag(db, res, tagName, data)
        } else {
            util.end(0, '未找到匹配项', data, res, db)
        }
    })
}

function searchTag(db, res, keyWord, data) {
    console.log(`开始在标签中查找关键词${keyWord}匹配项`)

    db.collection('content').aggregate([ {$match: {tag: keyWord}}, {$lookup: {localField: "dynasty_id", from: "dynasty", foreignField: "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$project: {id:1, title:1, "dynastyInfo.name":1, "authorInfo.name":1}}, {$sort: {sort_id:-1}} ]).toArray((err, docs) => {
        assert.equal(err, null)

        var count = docs.length
        if (count > 0) {
            console.log(`标签中找到${count}项匹配项`)

            data.works = []
            addSearchResult(docs, data, keyWord)
            util.end(0, '查询成功', data, res, db)
        } else {
            console.log('关键词在标签中未找到匹配项')

            util.end(0, '未找到匹配项', data, res, db)
        }
    })
}

// 添加搜索结果到列表中
function addSearchResult(docs, data, keyWord) {
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i]
        var work = {}

        work.id = doc.id
        work.title = doc.title
        work.author = doc.authorInfo.name
        work.dynasty = doc.dynastyInfo.name

        data.works.push(work)
    }
}

module.exports.post10009 = post10009;
