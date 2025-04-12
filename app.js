const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * In-memory session store.
 * Structure: { [sessionKey]: { participants: Set<socket.id>, ...futureData } }
 */
const sessions = {};

// Helper to generate a random session key
function generateSessionKey(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create a new session
  socket.on('createSession', () => {
    let key;
    do {
      key = generateSessionKey();
    } while (sessions[key]);
    sessions[key] = { participants: new Set([socket.id]), feedback: [] };
    socket.join(key);
    socket.sessionKey = key;
    socket.emit('sessionCreated', key);
    console.log(`Session created: ${key}`);
  });

  // Join an existing session
  socket.on('joinSession', (key) => {
    if (sessions[key]) {
      sessions[key].participants.add(socket.id);
      socket.join(key);
      socket.sessionKey = key;
      socket.emit('sessionJoined', key);
      console.log(`Socket ${socket.id} joined session ${key}`);
    } else {
      socket.emit('sessionError', 'Session not found.');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const key = socket.sessionKey;
    if (key && sessions[key]) {
      sessions[key].participants.delete(socket.id);
      if (sessions[key].participants.size === 0) {
        delete sessions[key];
        console.log(`Session ${key} deleted (no participants left)`);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});