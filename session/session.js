
const request = require('request');
const config = require('../config');
const util = require('../routes/util');
const assert = require('assert');
const cache = require('../util/cache');
const exec = require('child_process').exec;
const crypto = require('crypto');
const Promise = require('promise');

/**
登录
@param code 一次有效的登录用code
@result token

1. 使用code，获取session_key, openid, unionid
2. 存储openid和unionid到mongodb。如果不存在，新增用户uid
3. 生成3rd_session，存储session_key和uid到redis
4. 返回3rd_session
*/
function login(req, res, mongodb) {
	if (req.body.code) {
		console.log('login code is ' + req.body.code);

		request.get({
			uri: 'https://api.weixin.qq.com/sns/jscode2session',
			json: true,
			qs: {
				grant_type: 'authorization_code',
				appid: config.appId,
				secret: config.appSecret,
				js_code: req.body.code
			}
		}, (err, response, data) => {
			if (response.statusCode === 200 && data.openid && data.session_key) {
				console.log(data);

				var uid = 0;
				var token = '';

				saveOpenId(data, mongodb)
				.then((value) => {
					console.log(`uid is ${value}`);
					uid = value;
					return generateToken();
				}).then((value) => {
					console.log(`new token is ${value}, start save token`);
					token = value;
					return saveToken(token, data.session_key, uid);
				}).then((value) => {
					console.log(`save token result is ${value}`);
					if (value == 1) {
						var result = {};
						result.token = token;
						util.end(0, 'login result', result, res, mongodb);
					} else {
						var result = {};
						result.token = token;
						util.end(2, 'login result', result, res, mongodb);
					}
				});

			} else {
				console.log(data);
				util.end(2, 'login result', data, res, mongodb);
			}
		});
	} else {
		util.end(3, '请传入参数: code', {}, res, mongodb);
	}
}

/*
存储用户信息
@param token 绑定用户信息的token
@param userInfo

1. 使用token，从redis中取出uid
2. 存储userInfo到userInfo表
*/
function saveUserInfo(req, res, mongodb) {
	console.log(`start save user info, token is ${req.body.token}, userinfo is ${req.body.userInfo}`);
	if (req.body.token && req.body.userInfo) {
		const token = req.body.token;
		const userInfo = req.body.userInfo;

		console.log(userInfo);

		getData(token).then(function (data) {
			console.log(data);
			if (data == null) {
				util.end(2, 'token 失效', {}, res, mongodb);
			}
			var id = data.uid;
			console.log(`id is ${id}`);

			var gender = '未知';
			if (userInfo.gender == 1) {
				gender = '男';
			} else if (userInfo.gender == 2) {
				gender = '女';
			}
			console.log(`gender is ${gender}`);

			mongodb.collection('user').update({uid: id}, {$set: {nick_name: userInfo.nickName, avatar: userInfo.avatarUrl, gender: gender, city: userInfo.city, province: userInfo.province, country: userInfo.country, language: userInfo.language}});

			util.end(0, 'save userInfo complete', {}, res, mongodb);
		});
	} else {
		util.end(3, '请传入参数: token & userInfo', {}, res, mongodb);
	}
}

// 存储openid和unionid到mongodb。如果不存在，新增用户uid
function saveOpenId(data, mongodb) {
	// 从mongodb中查询openid，如果查询不到，从global表查找uid最大值，加1后新增用户，并更新global表uid最大值
	return new Promise((resolve, reject) => {
		if (data.openid) {
			console.log('start get infor from user');
			mongodb.collection('user').find({'openid': data.openid}, {'uid': 1}).toArray((err, docs) => {
				console.log('get info from user finish');
		        assert.equal(err, null);

		        var count = docs.length;
		        console.log('match user count is ' + count);
		        if (count == 0) {
		        	// 新用户，创建id，添加到数据库中
		        	getNewUserId(mongodb).then((newUserId) => {
		        		console.log('newUserId is ' + newUserId);
			        	mongodb.collection('user').insertOne({
			        		uid: newUserId,
			        		openid: data.openid,
			        		unionid: "",
			        		mobile: "",
			        		email: "",
			        		nick_name: "",
			        		avatar: "",
			        		gender: "",
			        		city: "",
			        		province: "",
			        		country: "",
			        		language: "",
			        		character: 0
			        	});

			        	resolve(newUserId);
		        	});
		        } else {
		        	// 老用户，返回
		        	console.log(`old user, uid is ${docs[0].uid}`);
		        	resolve(docs[0].uid);
		        }
		    });
		}
	});
}

// 获取新用户的uid
function getNewUserId(db) {
	return new Promise(function (resolve, reject) {
		db.collection('global').find({}, {'max_uid': 1, '_id':1}).toArray((err, docs) => {
		    assert.equal(err, null);

		    var id = docs[0]._id;
		    var newId = docs[0].max_uid + 1;
		    console.log('newid is ' + newId);

		    db.collection('global').update({_id: id}, {$set: {max_uid: newId}});

		    resolve(newId);
		});
	});
}

// 生成3rd_session(token)
function generateToken() {
	console.log('start to generate new token');
	return new Promise(function (resolve, reject) {
		exec('cat /dev/urandom | head -n 4', function(err, stdout, stderr) {
			// 生成随机数
			var token = crypto.createHash('sha1').update(stdout).digest('hex');
			console.log('new token is ' + token);
			resolve(token);
		});
	});
}

/**
保存3rd_session, session_key, uid
*/
function saveToken(token, session_key, uid) {
	console.log('start to save token ' + token + ", uid " + uid);

	return new Promise((resolve, reject) => {
		var value = {};
		value.session_key = session_key;
		value.uid = uid;

		cache.setString(token, JSON.stringify(value), (res) => {
			console.log('cache set string result is ' + res);
			resolve(res);
		});
	});
}

// 根据token，从redis中取出数据
function getData(token) {
	console.log(`get data from ${token}`);

	return new Promise((resolve, reject) => {
		cache.getString(token, (res) => {
			// 如果res为null，则token过期；如果不为null，则token未过期；
			console.log(`cache get string result is ${res}`);
			resolve(JSON.parse(res));
		});
	});
}

module.exports.login = login;
module.exports.saveUserInfo = saveUserInfo;
module.exports.getData = getData;

