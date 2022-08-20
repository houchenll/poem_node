
const assert = require('assert');
const util = require('./util');

function post10001(req, res, db) {
    var data = {};

    // get the documents collection
    var category = db.collection('category');
    // find all documents
    category.find({}, {'id': 1, 'name': 1}).toArray((err, docs) => {
        assert.equal(err, null);
        // console.log('found the following records');
        // console.log(docs);

        data.types = [];

        loopCategory(db, docs, 0, data, res);
    });
}

// 遍历分类列表
function loopCategory(db, docs, index, data, res) {
    var length = docs.length;

    if (index < length) {
        queryBook(db, docs[index].id, (books) => {
            var item = {};
            item.name = docs[index].name;
            item.books = books;
            data.types.push(item);
            loopCategory(db, docs, index + 1, data, res);
        });
    } else {
        util.end(0, 'categorys and books', data, res, db);
    }
    
}

// 从book表中，查询category_id对应的book列表，组装成数组然后返回
function queryBook(db, categoryId, callback) {
    var book = db.collection('book');
    book.find({'category_id': categoryId}, {'id': 1, 'name': 1, 'cover': 1}).toArray((err, docs) => {
        assert.equal(err, null);
        // console.log('found the following books');
        // console.log(docs);

        // 遍历docs，将所有数据组装到一个数组中，最后返回数组
        var result = [];

        var bookLength = docs.length;
        // console.log(`match book length is ${bookLength}`);

        var j = 0;
        for (j = 0; j < bookLength; j++) {
            // get one book
            var bookItem = {};
            bookItem.bookId = docs[j].id;
            bookItem.name = docs[j].name;
            bookItem.cover = docs[j].cover;

            // add book to books
            result.push(bookItem);
        }

        // return result
        callback(result);
    });
}

module.exports.post10001 = post10001;
