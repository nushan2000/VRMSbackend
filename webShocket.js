// server/websocket.js
const { Server } = require('socket.io');

module.exports = (server) => {
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle events like user disconnects, etc.
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    // Additional event handlers can be added as needed
  });

  return io;
};