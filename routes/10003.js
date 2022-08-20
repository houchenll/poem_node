const assert = require('assert');
const util = require('./util');

function post10003(req, res, db) {

    var data = {};
    data.dynasties = [];
    
    // 获取朝代列表并按时间排序
    db.collection('dynasty').find({}, {'id': 1, 'name': 1, 'author_count': 1, 'content_count': 1}).sort({id:1}).toArray((err, docs) => {
        assert.equal(err, null);

        for (var i = 0; i < docs.length; i++) {
            var item = {};

            item.id = docs[i].id;
            item.name = docs[i].name;
            item.authorCount = docs[i].author_count;
            item.contentCount = docs[i].content_count;
            data.dynasties.push(item);
        }

        util.end(0, 'dynasty list', data, res, db);
    });

}

module.exports.post10003 = post10003;
