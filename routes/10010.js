
const assert = require('assert');
const util = require('./util');

/*
搜索

搜索关键词可能是诗集、体裁、词牌、作者、标题、内容、标签等。

有时，同一个关键词既是作者，又匹配内容，所以，对关键词，要把它的各种可能性都考虑到。

但把每个情况都考虑一遍，效率会很低，代码运行时间会比较长，而且很多关键词只会匹配一种情况，所以，必须在合适的时候提前终止查询，不再考虑其它情况。

因而，对关键词的多种可能情况，要分开处理。

1. 假设关键词是作者姓名，首先在作者表中查询，如果匹配，就是查找该作者匹配的诗文。杜甫喜欢给李白写诗，所以李白的名字可能会出现在标题或内容中，故当关键词匹配作者的时候，就要检查标题和内容中是否含有关键词，如果有，不会很多，加在结果列表中。{{结果}}

2. 如果关键词匹配标题，就停止匹配，返回标签列表。{{结果}}

3. 如果关键词匹配标签，就停止匹配，返回标签列表。{{结果}}

4. 如果关键词匹配词牌、体裁时，这些内容不大可能会与内容或标题重合，那么可以假设用户就是想搜这些内容，可以就此停止。就这三种类型而言，以诗集、体裁、词牌的顺序匹配，只有上个没有匹配时，才匹配下一个，如果都不匹配，才进入下一步。{{结果}}

5. 最后，如果上述都不匹配，去内容中查找有没有匹配项，如果有，返回内容列表。{{结果}}

备注：
1. 不提供查询朝代功能，因为朝代下边内容太多。想查看朝代相关内容，去首页-朝代查看。
2. 不管哪种查询情况，返回的都只有一个列表，方便界面显示，按阅读数排序，阅读数相同时，按评分排序，评分也相同时，按点赞数排序，都相同时，按id排序。
3. 搜索时间不能大于200ms。
4. 内容中的标签需要全部添加到标签表中。
5. 词牌、体裁需要加在单独的表中。
6. 内容表中词牌、体裁需要有内容

搜索分作者、标题、标签、词牌、体裁、诗集、内容7类，优先级依次排列，每种的搜索函数格式统一为
searchXxx(db, res, keyWord, data)

返回数据为作品列表，每部作品内容包括：id, title, authorName, dynastyName, genre, reads, star, thumbUp, keyWord, sortId
*/

function post10010(req, res, db) {

    if (req.body.key) {
        var keyWord = req.body.key
        var data = {}
        data.result = []
        
        searchAuthor(db, res, keyWord, data)
    } else {
        util.end(3, '请传入参数: 关键词', {}, res, db)
    }

}

/**
获取作者为keyWord的作品列表
*/
function searchAuthor(db, res, keyWord, data) {
    console.log(`开始在作者中查找关键词${keyWord}匹配项`)

    db.collection('author').find({name: keyWord}, {id:1, name:1}).toArray((err, docs) => {
        assert.equal(err, null)

        var count = docs.length
        if (count > 0) {
            console.log(`作者中找到${count}项匹配项`)

            var authorId = docs[0].id
            var authorName = docs[0].name

            // 使用匹配的第一个作者
            db.collection('content').aggregate([ {$match: {author_id: authorId}}, {$lookup: {localField: "dynasty_id", from: "dynasty", foreignField: "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$project: {id:1, name:1, genre:1, reads:1, star:1, "dynastyInfo.name":1, "authorInfo.name":1, thumb_up:1, sort_id:1}}, {$sort: {sort_id:-1}} ]).toArray((err, docs1) => {
                assert.equal(err, null)

                if (docs1.length > 0) {
                    addSearchResult(docs1, data, keyWord)
                    // 继续在title和内容中查找匹配项，将匹配项加到作品列表中
                    searchTitle(db, res, keyWord, data, false)
                } else {
                    // 未查找到作者相关作品，继续在title和内容中查找匹配项
                    console.log('关键词未查找到作者相关作品，继续在title和内容中查找匹配项');
                    // 继续在title和内容中查找匹配项，将匹配项加到作品列表中
                    searchTitle(db, res, keyWord, data, true)
                }
            })
        } else {
            console.log('没有在作者中找到匹配项，继续去标题中查找')
            searchTitle(db, res, keyWord, data, true)
        }
    })
}

/**
获取标题中含有keyWord的作品列表
db.content.find({'title':{$regex:/静/}}, {name:1, content:1})
*/
function searchTitle(db, res, keyWord, data, isKeepSearchWhenNoTitleMatch) {
    console.log(`开始在标题中查找关键词${keyWord}匹配项`)

    var pattern = new RegExp(keyWord, 'g')
    db.collection('content').aggregate([ {$match: {title: pattern}}, {$lookup: {localField: "dynasty_id", from: "dynasty", foreignField: "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$project: {id:1, name:1, genre:1, reads:1, star:1, "dynastyInfo.name":1, "authorInfo.name":1, thumb_up:1, sort_id:1}}, {$sort: {sort_id:-1}} ]).toArray((err, docs) => {
        assert.equal(err, null)

        var count = docs.length
        if (count > 0) {
            console.log(`标题中找到${count}项匹配项`)

            addSearchResult(docs, data, keyWord)
            end(db, res, data)
        } else {
            if (isKeepSearchWhenNoTitleMatch) {
                console.log('关键词在标题中未找到匹配项，继续去标签中查找')
                searchTag(db, res, keyWord, data)
            } else {
                end(db, res, data)
            }
        }
    })
}

// 搜索标签
function searchTag(db, res, keyWord, data) {
    console.log(`开始在标签中查找关键词${keyWord}匹配项`)

    db.collection('content').aggregate([ {$match: {tag: keyWord}}, {$lookup: {localField: "dynasty_id", from: "dynasty", foreignField: "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$project: {id:1, name:1, genre:1, reads:1, star:1, "dynastyInfo.name":1, "authorInfo.name":1, thumb_up:1, sort_id:1}}, {$sort: {sort_id:-1}} ]).toArray((err, docs) => {
        assert.equal(err, null)

        var count = docs.length
        if (count > 0) {
            console.log(`标签中找到${count}项匹配项`)

            addSearchResult(docs, data, keyWord)
            end(db, res, data)
        } else {
            console.log('关键词在标签中未找到匹配项，继续去词牌中查找')

            searchCipai(db, res, keyWord, data)
        }
    })
}

// 搜索词牌
function searchCipai(db, res, keyWord, data) {
    console.log(`开始在词牌中查找关键词${keyWord}匹配项`)

    db.collection('content').aggregate([ {$match: {cipai: keyWord}}, {$lookup: {localField: "dynasty_id", from: "dynasty", foreignField: "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$project: {id:1, name:1, genre:1, reads:1, star:1, "dynastyInfo.name":1, "authorInfo.name":1, thumb_up:1, sort_id:1}}, {$sort: {sort_id:-1}} ]).toArray((err, docs) => {
        assert.equal(err, null)

        var count = docs.length
        if (count > 0) {
            console.log(`词牌中找到${count}项匹配项`)

            addSearchResult(docs, data, keyWord)
            end(db, res, data)
        } else {
            console.log('关键词在词牌中未找到匹配项，继续去体裁中查找')

            searchGenre(db, res, keyWord, data)
        }
    })
}

// 搜索体裁
function searchGenre(db, res, keyWord, data) {
    console.log(`开始在体裁中查找关键词${keyWord}匹配项`)

    var pattern = new RegExp(keyWord, 'g')
    db.collection('content').aggregate([ {$match: {genre: pattern}}, {$lookup: {localField: "dynasty_id", from: "dynasty", foreignField: "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$project: {id:1, name:1, genre:1, reads:1, star:1, "dynastyInfo.name":1, "authorInfo.name":1, thumb_up:1, sort_id:1}}, {$sort: {sort_id:-1}} ]).toArray((err, docs) => {
        assert.equal(err, null)

        var count = docs.length
        if (count > 0) {
            console.log(`体裁中找到${count}项匹配项`)

            addSearchResult(docs, data, keyWord)
            end(db, res, data)
        } else {
            console.log('关键词在体裁中未找到匹配项，继续去内容中查找')

            searchContent(db, res, keyWord, data)
        }
    })
}

// 搜索内容
function searchContent(db, res, keyWord, data) {
    console.log(`开始在内容中查找关键词${keyWord}匹配项`)

    var pattern = new RegExp(keyWord, 'g')
    db.collection('content').aggregate([ {$match: {content: pattern}}, {$lookup: {localField: "dynasty_id", from: "dynasty", foreignField: "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$project: {id:1, name:1, genre:1, reads:1, star:1, "dynastyInfo.name":1, "authorInfo.name":1, thumb_up:1, sort_id:1}}, {$sort: {sort_id:-1}} ]).toArray((err, docs) => {
        assert.equal(err, null)

        var count = docs.length
        if (count > 0) {
            console.log(`内容中找到${count}项匹配项`)

            addSearchResult(docs, data, keyWord)
            end(db, res, data)
        } else {
            console.log('关键词在内容中未找到匹配项，中止查找')

            end(db, res, data)
        }
    })
}

// 返回结果
function end(db, res, data) {
    util.end(0, '搜索结果', data, res, db)
}

// 添加搜索结果到列表中
function addSearchResult(docs, data, keyWord) {
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i]
        var work = {}

        work.id = doc.id
        work.title = doc.name
        work.author = doc.authorInfo.name
        work.dynasty = doc.dynastyInfo.name
        work.genre = doc.genre
        work.reads = doc.reads
        work.star = doc.star
        work.thumbUp = doc.thumb_up
        work.keyWord = keyWord
        work.sortId = doc.sort_id

        data.result.push(work)
    }
}

module.exports.post10010 = post10010
