var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var CircularBuffer = require("circular-buffer");
var dateFormat = require('dateformat');

// Buffer for the messages
var messageBuffer = new CircularBuffer(250);

var uniqueUsers = [];
var onlineUsers = [];

http.listen( port, function () {
    console.log('listening on port', port);
});

app.use(cookieParser());

// Generate username / color on connection if needed
app.get('/', function(req, res, next) {
    if (req.cookies.user === '' || req.cookies.user === undefined) {
        res.cookie('user', 'User' + uniqueUsers.length);
    }

    if (req.cookies.color == '' || req.cookies.color === undefined) {
        res.cookie('color', '#ffffff');
    }

    next();
});

app.use(express.static(__dirname + '/public'));

// listen to 'chat' messages
io.on('connection', function(socket) {
    // Emit the chatlog when a user first connects
    socket.emit('chatlog', messageBuffer.toarray());

    socket.on('chat', function(msg, name, color){
        let changeColorCommand = "/nickcolor";
        let changeNameCommand = "/nick";
        let splitMsg = msg.split(" ");

        if (changeColorCommand === splitMsg[0]) {
            let newColor = splitMsg[1];

            //If this is a valid hex color
            if (/^[0-9A-F]{6}$/i.test(newColor)) {
                socket.emit('recolor', '#'+ newColor);
            } else {
                socket.emit('errorMsg', newColor + ' is not a valid color! Please enter a color of the form RRGGBB');
            }

        } else if (changeNameCommand === splitMsg[0]) {
            let newName = splitMsg[1];
            let newNamePos = uniqueUsers.indexOf(newName);

            // Update lists and rename the user if this is an unused name.
            if (-1 === newNamePos) {
                uniqueUsers.splice(uniqueUsers.indexOf(socket.user), 1);
                uniqueUsers.push(newName);
                onlineUsers.splice(onlineUsers.indexOf(socket.user), 1);
                onlineUsers.push(newName);

                socket.emit('rename', newName);
                io.emit('userlistChange', onlineUsers);

                socket.user = newName;
            // Otherwise alert the user that this name is taken.
            } else {
                socket.emit('errorMsg', 'The nickname ' + newName + ' is already taken!');
            }
        } else {
            let msgData = { time: getTimeString(), color: color, user: socket.user, msg: msg };

            messageBuffer.push(msgData);
            io.emit('chat', msgData);
        }
    });

    // Set the username of this socket.
    socket.on('username', function(name) {
        socket.user = name;

        socket.emit('rename', name);
        let namePos = uniqueUsers.indexOf(name);

        if (-1 === namePos) {
            uniqueUsers.push(name);
        }

        onlineUsers.push(name);
        io.emit('userlistChange', onlineUsers);
    });

    // Remove user from online user list and update clients.
    socket.on('disconnect', function() {
        let userIdx = onlineUsers.indexOf(socket.user);

        if (-1 != userIdx) {
            onlineUsers.splice(userIdx, 1);
        }

        io.emit('userlistChange', onlineUsers);
    });
});

// Returns the current time
function getTimeString() {
    let now = new Date();
    return dateFormat(now, 'h:MM TT');
}
