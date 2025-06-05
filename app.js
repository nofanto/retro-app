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

  // Create a new session with configurable timer
  socket.on('createSession', ({ duration }) => {
    // Validate duration
    let minutes = parseInt(duration, 10);
    if (isNaN(minutes) || minutes < 1 || minutes > 30) {
      socket.emit('sessionError', 'Timer must be between 1 and 30 minutes.');
      return;
    }
    let key;
    do {
      key = generateSessionKey();
    } while (sessions[key]);
    const now = Date.now();
    const endTime = now + minutes * 60 * 1000;
    sessions[key] = {
      participants: new Set([socket.id]),
      feedback: [],
      phase: "obfuscate",
      startTime: now,
      duration: minutes,
      endTime,
      timer: null
    };
    socket.join(key);
    socket.sessionKey = key;
    socket.emit('sessionCreated', { key, duration: minutes, endTime });
    console.log(`Session created: ${key} with timer ${minutes} min`);

    // Start timer for phase transition
    sessions[key].timer = setTimeout(() => {
      sessions[key].phase = "reveal";
      io.to(key).emit('phaseUpdate', { phase: "reveal", endTime: null });
      // After 5 seconds in reveal, move to voting phase
      setTimeout(() => {
        if (sessions[key]) {
          sessions[key].phase = "voting";
          io.to(key).emit('phaseUpdate', { phase: "voting", endTime: null });
        }
      }, 5000);
      sessions[key].timer = null;
    }, minutes * 60 * 1000);
  });

  // Join an existing session
  socket.on('joinSession', (key) => {
    if (sessions[key]) {
      sessions[key].participants.add(socket.id);
      socket.join(key);
      socket.sessionKey = key;
      // Send session info including timer and phase
      socket.emit('sessionJoined', {
        key,
        duration: sessions[key].duration,
        endTime: sessions[key].phase === "obfuscate" ? sessions[key].endTime : null,
        phase: sessions[key].phase
      });
      console.log(`Socket ${socket.id} joined session ${key}`);
    } else {
      socket.emit('sessionError', 'Session not found.');
    }
  });

  // Handle disconnect and clean up timer
  socket.on('disconnect', () => {
    const key = socket.sessionKey;
    if (key && sessions[key]) {
      sessions[key].participants.delete(socket.id);
      if (sessions[key].participants.size === 0) {
        if (sessions[key].timer) clearTimeout(sessions[key].timer);
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
      const feedbackItem = { text, type, createdBy: socket.id, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9), votes: {} };
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
      // Obfuscate feedback if in obfuscate phase
      if (sessions[sessionKey].phase === "obfuscate") {
        // Only send obfuscated feedback (no text, just count)
        const obfuscated = sessions[sessionKey].feedback.map(item => ({
          id: item.id,
          type: item.type
        }));
        socket.emit('feedbackUpdate', obfuscated);
      } else {
        socket.emit('feedbackUpdate', sessions[sessionKey].feedback);
      }
    }
  });

  // Voting: upvote/downvote feedback
  socket.on('voteFeedback', ({ sessionKey, feedbackId, vote }) => {
    if (sessions[sessionKey] && sessions[sessionKey].phase === "voting") {
      const item = sessions[sessionKey].feedback.find(fb => fb.id === feedbackId);
      if (item) {
        if (!item.votes) item.votes = {};
        // Only allow 1 or -1
        if (vote === 1 || vote === -1) {
          item.votes[socket.id] = vote;
          io.to(sessionKey).emit('feedbackUpdate', sessions[sessionKey].feedback);
        }
      }
    }
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = { generateSessionKey };
