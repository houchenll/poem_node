const assert = require('assert');
const util = require('./util');

function post10004(req, res, db) {

    var data = {};
    data.themes = [];
    
    // 获取主题列表并按id排序
    db.collection('theme').find({}, {'id': 1, 'name': 1}).sort({id:1}).toArray((err, docs) => {
        assert.equal(err, null);

        forThemes(0, docs, db, data, res);
    });

}

// 对每个主题，获取它对应的子项
function forThemes(index, docs, db, data, res) {
    if (index < docs.length) {
        var themeId = docs[index].id;
        var themeName = docs[index].name;

        getTags(db, themeId, (tags) => {
            var themeItem = {};
            themeItem.name = themeName;
            themeItem.tags = tags;
            data.themes.push(themeItem);

            forThemes(index + 1, docs, db, data, res);
        });
    } else {
        util.end(0, 'theme list', data, res, db);
    }
}

// 获取主题对应的tag
function getTags(db, themeId, callback) {
    db.collection('tag').find({'theme_id': themeId}, {'name':1, 'sort_id':1, 'count': 1, 'image':1}).sort({'sort_id':1}).toArray((err, docs) => {
        assert.equal(err, null);

        var tags = [];

        for (var i = 0; i < docs.length; i++) {
            var tagItem = {};
            tagItem.id = docs[i].sort_id;
            tagItem.name = docs[i].name;
            tagItem.icon = docs[i].image;
            tagItem.count = docs[i].count;

            tags.push(tagItem);
        }

        callback(tags);
    });
}

module.exports.post10004 = post10004;
