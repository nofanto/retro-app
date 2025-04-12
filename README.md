# Retrospective Kanban App

A modern, real-time, local-only retrospective app for development teams. Run collaborative retro sessions with a stylish kanban board, configurable timer, feedback obfuscation, and voting—all in your browser, with no cloud or database required.

---

## Features

- **Kanban-style board** with "Went Well", "To Improve", and "Action Items" columns
- **Real-time collaboration** via WebSockets (Socket.IO)
- **Configurable session timer** (1–30 minutes) set by the session creator
- **Obfuscated feedback** during the timer: participants see only that feedback was added, not the content
- **Automatic reveal**: all feedback is shown when the timer ends
- **Drag-and-drop** to move feedback between columns after reveal
- **Export session** as JSON
- **Modern UI** with Tailwind CSS
- **No authentication, no database, no cloud**—runs entirely on your local machine

---

## Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer recommended)
- npm (comes with Node.js)

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the App

```bash
node app.js
```

The server will start on [http://localhost:3000](http://localhost:3000).

### 4. Open in Browser

Visit [http://localhost:3000](http://localhost:3000) in your browser.  
Share the session key with your team (on the same network) to join the same session.

---

## Usage

1. **Create a session:**  
   Enter a timer duration (1–30 min) and click "Create New Session".
2. **Join a session:**  
   Enter the session key provided by the creator.
3. **Add feedback:**  
   During the timer, add feedback to any column. Content is hidden until the timer ends.
4. **Reveal & voting:**  
   When the timer ends, all feedback is revealed. Drag-and-drop to move items between columns.
5. **Export:**  
   Click "Export Session as JSON" to download all feedback.

---

## Developer Notes

- **Project structure:**
  - `app.js` — Node.js/Express/Socket.IO backend
  - `public/` — Frontend (HTML/JS, uses Tailwind CDN)
  - `requirements/` — Design docs, requirements, and sample UI
- **No database:** All data is stored in memory and lost when the server stops.
- **No authentication:** Anyone on the same network can join with the session key.

---

## Customization

- To change the UI, edit `public/index.html` and use Tailwind CSS classes.
- To add features (e.g., voting, authentication), extend the backend and frontend logic.

---

## License

MIT License

---

## Credits

- Built with [Express](https://expressjs.com/), [Socket.IO](https://socket.io/), and [Tailwind CSS](https://tailwindcss.com/).