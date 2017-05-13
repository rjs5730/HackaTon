
var path = require('path');
var express=require('express'), 
    url = require('url'),
    mime = require('mime'),
    fs = require('fs'),
    //app=express(),
    http=require('http'),
    socketio=require('socket.io'),
    io;
 

var app = http.createServer(function(req, resp){
  var filename = path.join(__dirname, "https://hackaton-prototype.herokuapp.com/", url.parse(req.url).pathname);
  (fs.exists || path.exists)(filename, function(exists){
    if (exists) {
      fs.readFile(filename, function(err, data){
        if (err) {
          // File exists but is not readable (permissions issue?)
          resp.writeHead(500, {
            "Content-Type": "text/plain"
          });
          resp.write("Internal server error: could not read file");
          resp.end();
          return;
        }
 
        // File exists and is readable
        var mimetype = mime.lookup(filename);
        resp.writeHead(200, {
          "Content-Type": mimetype
        });
        resp.write(data);
        resp.end();
        return;
      });
    }
  });
});


var app = express()
  .use(SocketIOFileUploadServer.router)
  .use(express.static(__dirname + "https://hackaton-prototype.herokuapp.com/"))
  .listen(process.env.PORT || 3000);

// app.use(express.static(path.join(__dirname, '/')));
 //app.use(SocketIOFileUploadServer.router);
 //app.listen(3000);
/*app.get('/', function(req,res) {
    res.sendFile(__dirname+'/index.html');
});*/
 
//server=http.Server(app);
//server.listen(3000);

//app.io=socketIO(server);
 
 io=socketio.listen(app);

var numUsers=0;

io.sockets.on('connection',function(socket) {
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

    //canvas broadcast
    socket.on('drawing', function(data) {
          socket.broadcast.emit('drawing',data);
    });

    //youtube 영상 broadcast  
    
    socket.on('youtubeURLreceive', function(data) {
          //socket.emit('youtubeURL',data);
          socket.broadcast.emit('youtubeURL',data);
          console.log('execute'+data);
    });


});
