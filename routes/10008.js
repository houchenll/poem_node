const assert = require('assert');
const util = require('./util');

/*
获取朝代详情，包括名称、简介、头像。
*/
function post10008(req, res, db) {

    if (req.body.dynastyId) {
        var dynastyId = parseInt(req.body.dynastyId)

        db.collection('dynasty').find({id: dynastyId}, {name:1, intro:1, photo:1}).toArray((err, docs) => {
            assert.equal(err, null)

            var data = {}
            data.name = docs[0].name
            data.intro = docs[0].intro
            data.photo = docs[0].photo

            util.end(0, `朝代详情 ${dynastyId}`, data, res, db)
        })
    } else {
        util.end(3, '请传入参数：朝代id', {}, res, db)
    }

}

module.exports.post10008 = post10008
