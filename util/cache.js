
const redis = require('redis');
const client = redis.createClient('6379', '127.0.0.1');

const EXPIRE_SECONDS = 7 * 24 * 3600;

client.on('error', function(err) {
	console.log('redis client connect to server error');
});

// 校验key是否还存在
function checkKey(key, callback) {
	client.exists(key, (err, res) => {
		var count = int(res);
		callback(count > 0);
	});
}

// 获取key对应的值
function getString(key, callback) {
	client.get(key, (err, res) => {
		callback(res);
	});
}

// 设置key
function setString(key, value, callback) {
	client.set(key, value, (err, res) => {
		// 设置value成功时，设置过期时间
		if (res) {
			client.expire(key, EXPIRE_SECONDS, (err, res) => {
				callback(res);
			});
		}
	});
}

module.exports.checkKey = checkKey;
module.exports.getString = getString;
module.exports.setString = setString;
