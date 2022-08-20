
function end(retCode, retMsg, retData, res, db) {
    db.close()
    
    var result = {};
    result.retCode = retCode;
    result.retMsg = retMsg;
    result.data = retData;

    res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
    res.end(JSON.stringify(result));
}

module.exports.end = end;
