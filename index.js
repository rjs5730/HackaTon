
var path = require('path');
var express=require('express'),
    app=express(),
    http=require('http'),
    socketIO=require('socket.io'),
    server, io;
 
 app.use(express.static(path.join(__dirname, '/')));

 
app.get('/', function(req,res) {
    res.sendFile(__dirname+'/index.html');
});
 
server=http.Server(app);
server.listen(3000);
 
app.io=socketIO(server);
 

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
