var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http=require('http');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
var server=require('http').createServer(app);
app.io=require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

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
  res.render('error');
});

var numUsers=0;

app.io.on('connection',function(socket) {
  var addedUser=false;

  socket.on('new message',function(data) {
    socket.broadcast.emit('new message', {
      username: socket.username,
        message: data
    });
  });

  socket.on('add user', function(username) {
    if(addedUser) return;
    socket.username=username;
    ++numUsers;
    addedUser=true;
    socket.emit('login', {
      numUsers:numUsers
    });

    socket.broadcast.emit('user joined', {
      username: socket.username,
        numUsers:numUsers
    });
  });

  socket.on('typing',function() {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stop typing',function() {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

    socket.on('disconnect',function() {
      if(addedUser) {
          --numUsers;
          socket.broadcast.emit('user left', {
              username: socket.username,
              numUsers: numUsers
          });
      }
    });

    socket.on('drawing', function(data) {
          socket.broadcast.emit('drawing',data);
    });

});





module.exports = app;
