# Retrospective Session App – Local, Real-Time, In-Memory

## Overview

A lightweight, real-time collaborative retrospective app for local use. No authentication, no database, no cloud deployment. Sessions are ephemeral (in-memory only) and can be exported as JSON.

---

## 1. Tech Stack

- **Backend:** Node.js with Express and Socket.IO (serves static frontend and handles WebSocket events)
- **Frontend:** Simple HTML/CSS/JS (optionally React, Vue, or Svelte for better UX)
- **Storage:** In-memory (sessions exist only while the app is running)
- **Export:** Download session data as JSON
- **Deployment:** Local machine only (run with `node app.js`)

---

## 2. Core Features

- Start a new session (generates a unique session key)
- Join a session via session key
- Add feedback (e.g., “What went well”, “What can be improved”, “Action items”)
- Voting on feedback items (optional)
- Real-time updates for all users in a session (via WebSocket)
- Export session data as JSON

---

## 3. High-Level Architecture

```mermaid
flowchart TD
    A[Browser (User)]
    B[Node.js App (Express + Socket.IO)]
    C[In-memory Session Store]

    A -- HTTP --> B
    A -- WebSocket --> B
    B -- Store/Retrieve --> C
    B -- Export JSON --> A
```

- The Node.js app serves both the frontend and backend.
- All session data is stored in memory (lost when the app stops).
- Real-time updates are handled via Socket.IO.
- Users can export the current session as a JSON file.

---

## 4. User Flow

1. User starts the app locally (`node app.js`).
2. User creates a new session and receives a session key.
3. Other users join the session using the key (on the same network).
4. All users add feedback and see updates in real time.
5. At the end, the session can be exported as a JSON file.

---

## 5. Implementation Steps

1. **Project Setup:**  
   - Initialize Node.js project with Express and Socket.IO.
   - Serve static frontend files.

2. **Session Management:**  
   - Generate unique session keys.
   - Store session data in memory (object or Map).

3. **Real-time Collaboration:**  
   - Use Socket.IO to broadcast feedback and updates to all session participants.

4. **Export Functionality:**  
   - Add endpoint or frontend button to download session data as JSON.

5. **UI/UX:**  
   - Simple, responsive interface for session creation/joining, feedback, and export.

---

## 6. Constraints

- All data is lost when the app stops.
- No user accounts or authentication.
- No cloud deployment; runs only on the local machine.

---

## 7. Optional Enhancements

- Add simple voting on feedback items.
- Allow session renaming or categorization.
- Add basic analytics (e.g., number of feedback items, votes).
- Improve UI with a frontend framework if desired.