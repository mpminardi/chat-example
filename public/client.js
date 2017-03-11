// shorthand for $(document).ready(...)
$(function() {
    var socket = io();

    // Set socket username for server
    socket.emit('username', getCookie('user'));

    $('form').submit(function(){
	socket.emit('chat', $('#m').val(), getCookie('user'), getCookie('color'));
	$('#m').val('');
	return false;
    });

    // Output chat history
    socket.on('chatlog', function(msgArray) {
        for (idx in msgArray) {
            $('#messages').append($('<li>').append(formatMsg(msgArray[idx])));
        }
    });

    // Update chat window
    socket.on('chat', function(msg) {
        $('#messages').append($('<li>').append(formatMsg(msg)));
    });

    // Update user cookie
    socket.on('rename', function(name) {
	document.cookie = 'user=' + name;
        $('#username').text('You are ' + name);
    });

    // Update color cookie
    socket.on('recolor', function(color) {
        let msg = '<span style="color:' + color + '"> This is your new nickname color! </span>';
        document.cookie = 'color=' + color;
        $('#messages').append($('<li>').append(msg));
    });

    // Update user list
    socket.on('userlistChange', function(userList) {
        $('#users').empty();
        for (idx in userList) {
            $('#users').append($('<li>').text(userList[idx]));
        }
    });

    // Output error message
    socket.on('errorMsg', function(msg) {
        $('#messages').append($('<li>').append(msg));
    });
});

// Parses out the given cookie name
function getCookie(name) {
    let val = "";
    let splitCookie = ('; ' + document.cookie + ';').split('; ' + name + '=');

    if (splitCookie.length === 2) {
        val = splitCookie[1].substring(0, splitCookie[1].indexOf(";"));
    }

    return val;
}

// Formats a msg for displaying in the chatlog
function formatMsg(data) {
    let msgStyleStart = '<i>';
    let msgStyleEnd = '</i>';

    if (data.user === getCookie('user')) {
        msgStyleStart = '<b>';
        msgStyleEnd = '</b>';
    }

    let msg = data.time + '<span style="color:' + data.color + '"> ' + data.user + ' : </span>' + data.msg;
    return msgStyleStart + msg + msgStyleEnd;
}
