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

// Export session as JSON
app.get('/export/:sessionKey', (req, res) => {
  const { sessionKey } = req.params;
  const session = sessions[sessionKey];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const exportData = {
    sessionKey,
    feedback: session.feedback,
    exportedAt: new Date().toISOString(),
  };
  res.setHeader('Content-Disposition', `attachment; filename="retro-session-${sessionKey}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(exportData, null, 2));
});

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
  // Feedback: add feedback to a specific column
  socket.on('addFeedback', ({ sessionKey, text, type }) => {
    const validTypes = ['wentWell', 'toImprove', 'actionItem'];
    if (sessions[sessionKey] && validTypes.includes(type)) {
      const feedbackItem = { text, type, createdBy: socket.id, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9) };
      sessions[sessionKey].feedback.push(feedbackItem);
      // Broadcast updated feedback to all in session
      io.to(sessionKey).emit('feedbackUpdate', sessions[sessionKey].feedback);
    }
  });

  // Feedback: move feedback between columns
  socket.on('moveFeedback', ({ sessionKey, feedbackId, newType }) => {
    const validTypes = ['wentWell', 'toImprove', 'actionItem'];
    if (sessions[sessionKey] && validTypes.includes(newType)) {
      const item = sessions[sessionKey].feedback.find(fb => fb.id === feedbackId);
      if (item) {
        item.type = newType;
        io.to(sessionKey).emit('feedbackUpdate', sessions[sessionKey].feedback);
      }
    }
  });

  // Feedback: get feedback list
  socket.on('getFeedback', (sessionKey) => {
    if (sessions[sessionKey]) {
      socket.emit('feedbackUpdate', sessions[sessionKey].feedback);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});