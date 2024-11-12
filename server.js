// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Forward offer from one peer to another
    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
        console.log('Offer received and broadcasted');
    });

    // Forward answer from one peer to another
    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
        console.log('Answer received and broadcasted');
    });

    // Forward ICE candidate from one peer to another
    socket.on('ice-candidate', (candidate) => {
        socket.broadcast.emit('ice-candidate', candidate);
        console.log('ICE candidate received and broadcasted');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        socket.broadcast.emit('user-disconnected', socket.id); // Notify other peers of disconnection
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
