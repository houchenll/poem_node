
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const poem = require('./routes/poem');

const app = express();

const port = 9999;

// 为所有post请求统一指定解析方式
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 打印请求地址和参数
app.use(function (req, res, next) {
    // var reqParams = {};
    // reqParams.url = req.url;
    // reqParams.path = req.path;
    // reqParams.query = req.query;
    // reqParams.params = req.params;
    // reqParams.method = req.method;
    // reqParams.body = req.body;
    // reqParams.headers = req.headers;
    // console.log(reqParams);
    next();
});

app.use('/', poem);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.end('error');
});

// 服务器端运行时，不能指定hostname
const server = app.listen(port, () => {
    var host = server.address().address;
    var port = server.address().port;

    console.log(`server running at http://${host}:${port}/`);
});
