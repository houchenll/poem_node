const assert = require('assert');
const util = require('./util');

// 获取诗集、书籍目录
/*
1. 从body获取诗集id
2. 从menu文档中查找该书籍id对应的目录列表
3. 对每一个目录，获取它的id和名称，根据目录id，从content文档中查询它对应的诗文列表
4. 对每个诗文，获取它的id、标题、作者、朝代、体裁、阅读数
*/

function post10005(req, res, db) {

    // 获取诗集id
    if (req.body.bookId) {
        var bookId = parseInt(req.body.bookId)
        // console.log(`get book id ${bookId}`)

        db.collection('content').aggregate([{$match: {book_id: bookId}}, {$lookup: {localField: "author_id", from: "author", foreignField: "id", as: "authorInfo"}}, {$unwind: "$authorInfo"}, {$lookup: {localField: "dynasty_id", from: "dynasty", "foreignField": "id", as: "dynastyInfo"}}, {$unwind: "$dynastyInfo"}, {$lookup: {localField: "menu_id", from: "menu", "foreignField": "id", as: "menuInfo"}}, {$unwind: "$menuInfo"}, {$sort: {id:1}}, {$project: {id:1, name:1, genre:1, reads:1, "authorInfo.name":1, "dynastyInfo.name":1, menu_id:1, "menuInfo.name":1}}]).toArray((err, docs) => {
            assert.equal(err, null)

            var data = {}
            data.menus = [];

            var menu = {};
            var lastMenuId = 0;
            var length = docs.length;
            console.log(length);

            for (var i = 0; i < docs.length; i++) {
                var menuName = docs[i].menuInfo.name;
                var menuId = docs[i].menu_id;
                console.log(i, menuName, menuId);

                if (menuId != lastMenuId) {
                    // 开始一个新的目录，首先将旧的menu对象添加在menu列表中，然后重置menu对象，重置contents对象
                    if (lastMenuId != 0) {
                       data.menus.push(menu);
                       menu = {};
                    }

                    lastMenuId = menuId;
                    menu.name = docs[i].menuInfo.name;
                    menu.contents = [];
                }

                var item = {};
                item.id = docs[i].id;
                item.title = docs[i].name;
                item.genre = docs[i].genre;
                item.author = docs[i].authorInfo.name;
                item.dynasty = docs[i].dynastyInfo.name;
                item.reads = docs[i].reads;
                menu.contents.push(item);
                // console.log(item);
            }

            data.menus.push(menu);

            util.end(0, 'menu and content list', data, res, db)
        })
    } else {
        // console.log('no book id, return')
        util.end(3, '请传入参数：诗集id', {}, res, db)
    }

}

module.exports.post10005 = post10005;
