const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*" } 
});

app.use(cors());

const users = new Map();
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (username) => {
    if (!username) return;
    users.set(socket.id, username);
    onlineUsers.set(username, socket.id);
    socket.username = username;
    io.emit('users-update', Array.from(onlineUsers.keys()));
  });

  socket.on('offer', ({ to, offer }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit('offer', { from: socket.username, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit('answer', { from: socket.username, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit('ice-candidate', { candidate });
  });

  socket.on('end-call', ({ to }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit('call-ended');
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      onlineUsers.delete(username);
      io.emit('users-update', Array.from(onlineUsers.keys()));
      users.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});