# ♟️ ChessArena - Real-Time Online Chess Platform

A modern, full-stack real-time online chess platform featuring live WebSocket-powered multiplayer matchmaking, customizable time controls (Bullet, Blitz, Rapid, Classical), AI chess opponents with variable difficulty levels, live spectator mode, interactive move-by-move game analysis, and competitive Elo leaderboards.

---

## ✨ Features

- **🌐 Live Real-Time Multiplayer (PvP)**: Play online against players around the globe via WebSocket communication. Includes quick matchmaking queues and custom private room invite codes.
- **👁️ Live Spectator Mode**: View active games between online players in real-time, complete with live spectator count badges and move synchronizations.
- **🤖 Engine & AI Opponents**: Challenge AI opponents across **Easy**, **Medium**, and **Hard** difficulty settings with positional valuation engines.
- **⏱️ Flexible Time Controls**: Bullet (1+0, 2+1), Blitz (3+0, 5+3), Rapid (10+0, 15+10), and Classical (30+0) with live digital game clocks and increment support.
- **📊 Interactive Game Analysis & Replay**: Review completed matches move-by-move with auto-play, material balance counters, captured piece tracking, and SAN move notation tables.
- **🏆 Elo Rating & Match History**: User profile records, match stats (wins/losses/draws), historical game records, and a live competitive global leaderboard.
- **💬 In-Game Chat & Draw/Resign Controls**: Integrated in-game chat, draw offers, resignations, and instant rematch requests.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend & Realtime**: Node.js, Express, WebSocket (`ws`), `chess.js`
- **Build System**: Vite, `esbuild`, `tsx`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/chess-arena.git
   cd chess-arena
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 📦 Scripts

- `npm run dev`: Starts the development server using `tsx` and Vite.
- `npm run build`: Bundles the client app with Vite and the backend server with `esbuild`.
- `npm run start`: Runs the production CommonJS server build (`dist/server.cjs`).
- `npm run lint`: Runs TypeScript type checking (`tsc --noEmit`).

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
