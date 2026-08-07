import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { Chess } from 'chess.js';
import { createServer as createViteServer } from 'vite';
import {
  UserProfile,
  GameRoom,
  ChatMessage,
  MatchHistoryItem,
  LeaderboardEntry,
  WSClientMessage,
  WSServerMessage,
  TimeControl,
  PieceColor,
} from './src/types';
import { calculateEloDelta, getAIMove, evaluateBoard } from './src/lib/chessEngine';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  users: Record<string, UserProfile>;
  matchHistory: MatchHistoryItem[];
}

let dbData: DatabaseSchema = {
  users: {},
  matchHistory: [],
};

// Load database from file
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbData = JSON.parse(content);
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Error reading DB file:', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

loadDatabase();

// In-memory active game rooms, spectators & matchmaking queue
const activeRooms: Map<string, GameRoom> = new Map();
const activeRoomSpectators: Map<string, Set<WebSocket>> = new Map();
const socketToUser: Map<WebSocket, string> = new Map();
const userToSocket: Map<string, WebSocket> = new Map();

interface QueueEntry {
  socket: WebSocket;
  user: UserProfile;
  timeControl: TimeControl;
  isRated: boolean;
  joinedAt: number;
}

const matchmakingQueue: QueueEntry[] = [];

// Create default bot & seed players if empty
if (Object.keys(dbData.users).length === 0) {
  const seedUsers: UserProfile[] = [
    {
      id: 'bot_grandmaster',
      username: 'MagnusBot (AI)',
      isGuest: false,
      elo: 2200,
      peakElo: 2250,
      wins: 142,
      losses: 20,
      draws: 15,
      avatarUrl: 'https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=150&auto=format&fit=crop&q=80',
      joinedAt: Date.now() - 10000000,
    },
    {
      id: 'bot_master',
      username: 'HikaruBot (AI)',
      isGuest: false,
      elo: 1850,
      peakElo: 1900,
      wins: 98,
      losses: 35,
      draws: 12,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      joinedAt: Date.now() - 8000000,
    },
    {
      id: 'bot_novice',
      username: 'ChessNovice (AI)',
      isGuest: false,
      elo: 1100,
      peakElo: 1150,
      wins: 15,
      losses: 42,
      draws: 3,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      joinedAt: Date.now() - 5000000,
    },
  ];

  seedUsers.forEach((u) => {
    dbData.users[u.id] = u;
  });
  saveDatabase();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post('/api/auth/login', (req, res) => {
    const { username } = req.body;
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim();
    let user = Object.values(dbData.users).find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (!user) {
      const id = 'user_' + Math.random().toString(36).substr(2, 9);
      user = {
        id,
        username: cleanUsername,
        isGuest: false,
        elo: 1200,
        peakElo: 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        joinedAt: Date.now(),
      };
      dbData.users[id] = user;
      saveDatabase();
    }

    res.json({ user });
  });

  app.post('/api/auth/guest', (req, res) => {
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const username = `Guest_${guestNum}`;
    const id = 'guest_' + Math.random().toString(36).substr(2, 9);

    const user: UserProfile = {
      id,
      username,
      isGuest: true,
      elo: 1200,
      peakElo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`,
      joinedAt: Date.now(),
    };

    dbData.users[id] = user;
    saveDatabase();

    res.json({ user });
  });

  app.get('/api/leaderboard', (req, res) => {
    const users = Object.values(dbData.users);
    users.sort((a, b) => b.elo - a.elo);

    const leaderboard: LeaderboardEntry[] = users.map((u, idx) => {
      const total = u.wins + u.losses + u.draws;
      const winRate = total > 0 ? Math.round((u.wins / total) * 100) : 0;
      return {
        rank: idx + 1,
        id: u.id,
        username: u.username,
        elo: u.elo,
        wins: u.wins,
        losses: u.losses,
        draws: u.draws,
        winRate,
        avatarUrl: u.avatarUrl,
        isGuest: u.isGuest,
      };
    });

    res.json({ leaderboard });
  });

  app.get('/api/match-history/:userId', (req, res) => {
    const { userId } = req.params;
    const history = dbData.matchHistory.filter(
      (m) => m.whitePlayerName === dbData.users[userId]?.username || m.blackPlayerName === dbData.users[userId]?.username
    );
    history.sort((a, b) => b.playedAt - a.playedAt);
    res.json({ history });
  });

  app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params;
    const user = dbData.users[userId];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });

  app.get('/api/live-games', (req, res) => {
    const liveGames = Array.from(activeRooms.values())
      .filter((r) => r.status === 'active' || r.status === 'waiting')
      .map((r) => ({
        ...r,
        spectatorsCount: activeRoomSpectators.get(r.id)?.size || 0,
      }));
    res.json({ games: liveGames });
  });

  const server = createServer(app);

  // WebSocket Server setup
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.on('message', (rawData) => {
      try {
        const msg: WSClientMessage = JSON.parse(rawData.toString());
        handleWSMessage(ws, msg);
      } catch (err) {
        console.error('WS parse error:', err);
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });
  });

  function sendWS(ws: WebSocket, payload: WSServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  function broadcastRoom(roomId: string, payload: WSServerMessage) {
    const room = activeRooms.get(roomId);
    if (!room) return;

    // Attach current spectator count if payload has room
    if (payload.type === 'ROOM_STATE' && payload.room) {
      payload.room.spectatorsCount = activeRoomSpectators.get(roomId)?.size || 0;
    }

    if (room.whitePlayer) {
      const ws = userToSocket.get(room.whitePlayer.id);
      if (ws) sendWS(ws, payload);
    }
    if (room.blackPlayer) {
      const ws = userToSocket.get(room.blackPlayer.id);
      if (ws) sendWS(ws, payload);
    }

    // Broadcast to spectators
    const specSet = activeRoomSpectators.get(roomId);
    if (specSet) {
      specSet.forEach((specWs) => {
        sendWS(specWs, payload);
      });
    }
  }

  function handleWSMessage(ws: WebSocket, msg: WSClientMessage) {
    switch (msg.type) {
      case 'AUTH': {
        const user = msg.user;
        if (user && user.id) {
          socketToUser.set(ws, user.id);
          userToSocket.set(user.id, ws);
          // Keep database in sync
          if (dbData.users[user.id]) {
            dbData.users[user.id].username = user.username;
          } else {
            dbData.users[user.id] = user;
            saveDatabase();
          }
          sendWS(ws, { type: 'CONNECTED', userId: user.id });
        }
        break;
      }

      case 'JOIN_QUEUE': {
        const userId = socketToUser.get(ws);
        const user = userId ? dbData.users[userId] : null;
        if (!user) {
          sendWS(ws, { type: 'ERROR', message: 'User not authenticated' });
          return;
        }

        // Remove from existing queue if any
        const existingIdx = matchmakingQueue.findIndex((q) => q.user.id === user.id);
        if (existingIdx !== -1) matchmakingQueue.splice(existingIdx, 1);

        // Check if there's a match in queue
        const matchIdx = matchmakingQueue.findIndex(
          (q) => q.timeControl.initialMinutes === msg.timeControl.initialMinutes && q.isRated === msg.isRated
        );

        if (matchIdx !== -1) {
          const opponent = matchmakingQueue.splice(matchIdx, 1)[0];
          const roomId = 'room_' + Math.random().toString(36).substr(2, 8);
          const code = Math.floor(100000 + Math.random() * 900000).toString();

          // Randomize colors
          const isUserWhite = Math.random() > 0.5;
          const white = isUserWhite ? user : opponent.user;
          const black = isUserWhite ? opponent.user : user;

          const totalMs = msg.timeControl.initialMinutes * 60 * 1000;

          const room: GameRoom = {
            id: roomId,
            code,
            mode: 'pvp_online',
            whitePlayer: {
              id: white.id,
              username: white.username,
              elo: white.elo,
              avatarUrl: white.avatarUrl,
              isGuest: white.isGuest,
              connected: true,
            },
            blackPlayer: {
              id: black.id,
              username: black.username,
              elo: black.elo,
              avatarUrl: black.avatarUrl,
              isGuest: black.isGuest,
              connected: true,
            },
            fen: new Chess().fen(),
            turn: 'w',
            status: 'active',
            winner: null,
            timeControl: msg.timeControl,
            whiteTimeLeft: totalMs,
            blackTimeLeft: totalMs,
            lastMoveTimestamp: Date.now(),
            history: [],
            lastMove: null,
            drawOfferedBy: null,
            rematchRequestedBy: null,
            createdAt: Date.now(),
            isRated: msg.isRated,
          };

          activeRooms.set(roomId, room);

          sendWS(ws, { type: 'MATCH_FOUND', roomId });
          sendWS(opponent.socket, { type: 'MATCH_FOUND', roomId });

          broadcastRoom(roomId, { type: 'ROOM_STATE', room });
        } else {
          matchmakingQueue.push({
            socket: ws,
            user,
            timeControl: msg.timeControl,
            isRated: msg.isRated,
            joinedAt: Date.now(),
          });

          sendWS(ws, {
            type: 'QUEUE_STATUS',
            position: matchmakingQueue.length,
            totalInQueue: matchmakingQueue.length,
          });
        }
        break;
      }

      case 'LEAVE_QUEUE': {
        const userId = socketToUser.get(ws);
        if (userId) {
          const idx = matchmakingQueue.findIndex((q) => q.user.id === userId);
          if (idx !== -1) matchmakingQueue.splice(idx, 1);
        }
        break;
      }

      case 'CREATE_ROOM': {
        const userId = socketToUser.get(ws);
        const user = userId ? dbData.users[userId] : null;
        if (!user) {
          sendWS(ws, { type: 'ERROR', message: 'User not authenticated' });
          return;
        }

        const roomId = 'room_' + Math.random().toString(36).substr(2, 8);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const totalMs = msg.timeControl.initialMinutes * 60 * 1000;

        let blackPlayer: GameRoom['blackPlayer'] = null;

        if (msg.mode === 'ai') {
          const aiDifficulty = msg.aiDifficulty || 'medium';
          const eloMap = { easy: 1100, medium: 1550, hard: 2100 };
          const nameMap = { easy: 'ChessNovice (AI)', medium: 'HikaruBot (AI)', hard: 'MagnusBot (AI)' };

          blackPlayer = {
            id: `ai_${aiDifficulty}`,
            username: nameMap[aiDifficulty],
            elo: eloMap[aiDifficulty],
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=ai_${aiDifficulty}`,
            isGuest: false,
            connected: true,
          };
        } else if (msg.mode === 'pvp_local') {
          blackPlayer = {
            id: 'local_black',
            username: 'Player 2 (Black)',
            elo: 1200,
            avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=player2',
            isGuest: true,
            connected: true,
          };
        }

        const room: GameRoom = {
          id: roomId,
          code,
          mode: msg.mode,
          aiDifficulty: msg.aiDifficulty,
          whitePlayer: {
            id: user.id,
            username: msg.mode === 'pvp_local' ? 'Player 1 (White)' : user.username,
            elo: user.elo,
            avatarUrl: user.avatarUrl,
            isGuest: user.isGuest,
            connected: true,
          },
          blackPlayer,
          fen: new Chess().fen(),
          turn: 'w',
          status: msg.mode === 'pvp_online' && !blackPlayer ? 'waiting' : 'active',
          winner: null,
          timeControl: msg.timeControl,
          whiteTimeLeft: totalMs,
          blackTimeLeft: totalMs,
          lastMoveTimestamp: Date.now(),
          history: [],
          lastMove: null,
          drawOfferedBy: null,
          rematchRequestedBy: null,
          createdAt: Date.now(),
          isRated: msg.isRated !== false,
        };

        activeRooms.set(roomId, room);
        sendWS(ws, { type: 'ROOM_STATE', room });
        break;
      }

      case 'JOIN_ROOM': {
        const userId = socketToUser.get(ws);
        const user = userId ? dbData.users[userId] : null;
        if (!user) {
          sendWS(ws, { type: 'ERROR', message: 'User not authenticated' });
          return;
        }

        const room = Array.from(activeRooms.values()).find((r) => r.code === msg.roomCode);
        if (!room) {
          sendWS(ws, { type: 'ERROR', message: 'Game room not found' });
          return;
        }

        if (room.whitePlayer.id !== user.id && (!room.blackPlayer || room.blackPlayer.id === user.id)) {
          room.blackPlayer = {
            id: user.id,
            username: user.username,
            elo: user.elo,
            avatarUrl: user.avatarUrl,
            isGuest: user.isGuest,
            connected: true,
          };
          room.status = 'active';
          room.lastMoveTimestamp = Date.now();
        }

        broadcastRoom(room.id, { type: 'ROOM_STATE', room });
        break;
      }

      case 'MAKE_MOVE': {
        const userId = socketToUser.get(ws);
        const room = activeRooms.get(msg.roomId);
        if (!room) return;

        // Verify player turn
        if (room.status !== 'active') return;

        const chess = new Chess(room.fen);
        const currentTurnColor = chess.turn();

        // Ensure user is the player whose turn it is
        const isWhiteUser = room.whitePlayer.id === userId;
        const isBlackUser = room.blackPlayer?.id === userId;

        if (room.mode === 'pvp_online') {
          if (currentTurnColor === 'w' && !isWhiteUser) return;
          if (currentTurnColor === 'b' && !isBlackUser) return;
        }

        try {
          const move = chess.move({
            from: msg.from,
            to: msg.to,
            promotion: msg.promotion || 'q',
          });

          if (!move) {
            sendWS(ws, { type: 'ERROR', message: 'Illegal move' });
            return;
          }

          // Deduct time used
          const now = Date.now();
          if (room.lastMoveTimestamp) {
            const elapsed = now - room.lastMoveTimestamp;
            if (currentTurnColor === 'w') {
              room.whiteTimeLeft = Math.max(0, room.whiteTimeLeft - elapsed + room.timeControl.incrementSeconds * 1000);
            } else {
              room.blackTimeLeft = Math.max(0, room.blackTimeLeft - elapsed + room.timeControl.incrementSeconds * 1000);
            }
          }
          room.lastMoveTimestamp = now;

          // Record move
          const moveRecord = {
            moveNumber: Math.floor(room.history.length / 2) + 1,
            san: move.san,
            from: move.from,
            to: move.to,
            piece: move.piece,
            color: move.color,
            fen: chess.fen(),
            captured: move.captured,
            timeRemaining: move.color === 'w' ? room.whiteTimeLeft : room.blackTimeLeft,
          };

          room.history.push(moveRecord);
          room.fen = chess.fen();
          room.turn = chess.turn();
          room.lastMove = { from: move.from, to: move.to, san: move.san };

          // Check for Game Over conditions
          if (chess.isGameOver()) {
            handleGameOver(room, chess);
          } else if (room.mode === 'ai' && room.turn === 'b' && room.status === 'active') {
            // Trigger AI response move
            setTimeout(() => {
              executeAIMove(room);
            }, 400);
          }

          broadcastRoom(room.id, { type: 'ROOM_STATE', room });
        } catch (err) {
          sendWS(ws, { type: 'ERROR', message: 'Move failed: ' + (err as Error).message });
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        const userId = socketToUser.get(ws);
        const user = userId ? dbData.users[userId] : null;
        if (!user) return;

        const chatMsg: ChatMessage = {
          id: 'msg_' + Math.random().toString(36).substr(2, 9),
          roomId: msg.roomId,
          senderId: user.id,
          senderName: user.username,
          message: msg.message.slice(0, 280),
          timestamp: Date.now(),
        };

        broadcastRoom(msg.roomId, { type: 'CHAT_BROADCAST', message: chatMsg });
        break;
      }

      case 'OFFER_DRAW': {
        const userId = socketToUser.get(ws);
        const room = activeRooms.get(msg.roomId);
        if (!room || room.status !== 'active') return;

        const color: PieceColor = room.whitePlayer.id === userId ? 'w' : 'b';
        room.drawOfferedBy = color;

        broadcastRoom(room.id, { type: 'ROOM_STATE', room });

        const sysMsg: ChatMessage = {
          id: 'sys_' + Date.now(),
          roomId: room.id,
          senderId: 'system',
          senderName: 'System',
          message: `${color === 'w' ? room.whitePlayer.username : (room.blackPlayer?.username || 'Opponent')} offered a draw.`,
          timestamp: Date.now(),
          isSystem: true,
        };
        broadcastRoom(room.id, { type: 'CHAT_BROADCAST', message: sysMsg });

        // Handle AI draw response if playing against bot
        if (room.mode === 'ai') {
          setTimeout(() => {
            if (room.status !== 'active' || !room.drawOfferedBy) return;

            const chess = new Chess(room.fen);
            const score = evaluateBoard(chess); // positive = White ahead, negative = Black ahead
            // Bot is Black: if White score <= 30 (bot equal or winning or slightly behind) or random chance
            const aiAccepts = score <= 30 || Math.random() < 0.5;

            if (aiAccepts) {
              room.status = 'draw';
              room.winner = 'draw';
              room.winReason = 'Draw agreed with Bot';
              room.drawOfferedBy = null;
              finalizeGameOutcome(room);

              broadcastRoom(room.id, { type: 'ROOM_STATE', room });
              broadcastRoom(room.id, {
                type: 'CHAT_BROADCAST',
                message: {
                  id: 'sys_' + Date.now(),
                  roomId: room.id,
                  senderId: 'system',
                  senderName: 'System',
                  message: 'Bot accepted the draw offer. Game drawn!',
                  timestamp: Date.now(),
                  isSystem: true,
                },
              });
            } else {
              room.drawOfferedBy = null;
              broadcastRoom(room.id, { type: 'ROOM_STATE', room });
              broadcastRoom(room.id, {
                type: 'CHAT_BROADCAST',
                message: {
                  id: 'sys_' + Date.now(),
                  roomId: room.id,
                  senderId: 'system',
                  senderName: 'System',
                  message: 'Bot declined the draw offer.',
                  timestamp: Date.now(),
                  isSystem: true,
                },
              });
            }
          }, 1000);
        }
        break;
      }

      case 'RESPOND_DRAW': {
        const userId = socketToUser.get(ws);
        const room = activeRooms.get(msg.roomId);
        if (!room || !room.drawOfferedBy) return;

        if (msg.accept) {
          room.status = 'draw';
          room.winner = 'draw';
          room.winReason = 'Draw agreed by players';
          room.drawOfferedBy = null;
          finalizeGameOutcome(room);

          broadcastRoom(room.id, { type: 'ROOM_STATE', room });
          broadcastRoom(room.id, {
            type: 'CHAT_BROADCAST',
            message: {
              id: 'sys_' + Date.now(),
              roomId: room.id,
              senderId: 'system',
              senderName: 'System',
              message: 'Draw offer accepted. Game drawn!',
              timestamp: Date.now(),
              isSystem: true,
            },
          });
        } else {
          room.drawOfferedBy = null;
          broadcastRoom(room.id, { type: 'ROOM_STATE', room });
          broadcastRoom(room.id, {
            type: 'CHAT_BROADCAST',
            message: {
              id: 'sys_' + Date.now(),
              roomId: room.id,
              senderId: 'system',
              senderName: 'System',
              message: 'Draw offer was declined.',
              timestamp: Date.now(),
              isSystem: true,
            },
          });
        }
        break;
      }

      case 'RESIGN': {
        const userId = socketToUser.get(ws);
        const room = activeRooms.get(msg.roomId);
        if (!room || room.status !== 'active') return;

        const isWhite = room.whitePlayer.id === userId;
        room.status = 'resigned';
        room.winner = isWhite ? 'b' : 'w';
        room.winReason = `${isWhite ? room.whitePlayer.username : room.blackPlayer?.username} resigned.`;

        finalizeGameOutcome(room);
        broadcastRoom(room.id, { type: 'ROOM_STATE', room });
        break;
      }

      case 'REQUEST_REMATCH': {
        const userId = socketToUser.get(ws);
        const room = activeRooms.get(msg.roomId);
        if (!room) return;

        const color: PieceColor = room.whitePlayer.id === userId ? 'w' : 'b';
        room.rematchRequestedBy = color;

        broadcastRoom(room.id, { type: 'ROOM_STATE', room });
        break;
      }

      case 'RESPOND_REMATCH': {
        const userId = socketToUser.get(ws);
        const room = activeRooms.get(msg.roomId);
        if (!room || !room.rematchRequestedBy) return;

        if (msg.accept) {
          // Reset game room
          const totalMs = room.timeControl.initialMinutes * 60 * 1000;
          room.fen = new Chess().fen();
          room.turn = 'w';
          room.status = 'active';
          room.winner = null;
          room.winReason = undefined;
          room.whiteTimeLeft = totalMs;
          room.blackTimeLeft = totalMs;
          room.lastMoveTimestamp = Date.now();
          room.history = [];
          room.lastMove = null;
          room.drawOfferedBy = null;
          room.rematchRequestedBy = null;
          room.eloChange = undefined;

          // Swap colors for fairness
          const temp = room.whitePlayer;
          room.whitePlayer = room.blackPlayer!;
          room.blackPlayer = temp;

          broadcastRoom(room.id, { type: 'ROOM_STATE', room });
        } else {
          room.rematchRequestedBy = null;
          broadcastRoom(room.id, { type: 'ROOM_STATE', room });
        }
        break;
      }

      case 'SPECTATE_ROOM': {
        const room = activeRooms.get(msg.roomId);
        if (!room) {
          sendWS(ws, { type: 'ERROR', message: 'Game room not found for spectating' });
          return;
        }

        if (!activeRoomSpectators.has(room.id)) {
          activeRoomSpectators.set(room.id, new Set());
        }
        activeRoomSpectators.get(room.id)!.add(ws);

        room.spectatorsCount = activeRoomSpectators.get(room.id)?.size || 0;
        sendWS(ws, { type: 'ROOM_STATE', room });

        // Notify room of updated spectator count
        broadcastRoom(room.id, { type: 'ROOM_STATE', room });
        break;
      }

      case 'LEAVE_SPECTATE': {
        const specSet = activeRoomSpectators.get(msg.roomId);
        if (specSet) {
          specSet.delete(ws);
          const room = activeRooms.get(msg.roomId);
          if (room) {
            room.spectatorsCount = specSet.size;
            broadcastRoom(room.id, { type: 'ROOM_STATE', room });
          }
        }
        break;
      }
    }
  }

  function executeAIMove(room: GameRoom) {
    if (room.status !== 'active') return;

    const chess = new Chess(room.fen);
    const move = getAIMove(room.fen, room.aiDifficulty || 'medium');

    if (move) {
      chess.move(move);

      const moveRecord = {
        moveNumber: Math.floor(room.history.length / 2) + 1,
        san: move.san,
        from: move.from,
        to: move.to,
        piece: move.piece,
        color: move.color,
        fen: chess.fen(),
        captured: move.captured,
        timeRemaining: room.blackTimeLeft,
      };

      room.history.push(moveRecord);
      room.fen = chess.fen();
      room.turn = chess.turn();
      room.lastMove = { from: move.from, to: move.to, san: move.san };

      if (chess.isGameOver()) {
        handleGameOver(room, chess);
      }

      broadcastRoom(room.id, { type: 'ROOM_STATE', room });
    }
  }

  function handleGameOver(room: GameRoom, chess: Chess) {
    if (chess.isCheckmate()) {
      room.status = 'checkmate';
      room.winner = chess.turn() === 'w' ? 'b' : 'w';
      room.winReason = 'Checkmate';
    } else if (chess.isStalemate()) {
      room.status = 'stalemate';
      room.winner = 'draw';
      room.winReason = 'Stalemate';
    } else if (chess.isThreefoldRepetition()) {
      room.status = 'draw';
      room.winner = 'draw';
      room.winReason = 'Threefold Repetition';
    } else if (chess.isInsufficientMaterial()) {
      room.status = 'draw';
      room.winner = 'draw';
      room.winReason = 'Insufficient Material';
    } else {
      room.status = 'draw';
      room.winner = 'draw';
      room.winReason = '50-Move Rule Draw';
    }

    finalizeGameOutcome(room);
  }

  function finalizeGameOutcome(room: GameRoom) {
    if (!room.blackPlayer) return;

    const whiteUser = dbData.users[room.whitePlayer.id];
    const blackUser = dbData.users[room.blackPlayer.id];

    let scoreA = 0.5; // White
    if (room.winner === 'w') scoreA = 1;
    if (room.winner === 'b') scoreA = 0;

    let deltaW = 0;
    let deltaB = 0;

    if (room.isRated) {
      const whiteElo = whiteUser ? whiteUser.elo : room.whitePlayer.elo;
      const blackElo = blackUser ? blackUser.elo : room.blackPlayer.elo;

      const eloRes = calculateEloDelta(whiteElo, blackElo, scoreA);
      deltaW = eloRes.deltaA;
      deltaB = eloRes.deltaB;

      room.eloChange = { white: deltaW, black: deltaB };

      // Update registered users
      if (whiteUser && !whiteUser.isGuest) {
        whiteUser.elo = Math.max(100, whiteUser.elo + deltaW);
        whiteUser.peakElo = Math.max(whiteUser.peakElo, whiteUser.elo);
        if (scoreA === 1) whiteUser.wins++;
        else if (scoreA === 0) whiteUser.losses++;
        else whiteUser.draws++;
      }

      if (blackUser && !blackUser.isGuest) {
        blackUser.elo = Math.max(100, blackUser.elo + deltaB);
        blackUser.peakElo = Math.max(blackUser.peakElo, blackUser.elo);
        if (scoreA === 0) blackUser.wins++;
        else if (scoreA === 1) blackUser.losses++;
        else blackUser.draws++;
      }

      saveDatabase();
    }

    // Save match history
    const matchItem: MatchHistoryItem = {
      id: 'match_' + room.id,
      playedAt: Date.now(),
      mode: room.mode,
      whitePlayerName: room.whitePlayer.username,
      blackPlayerName: room.blackPlayer.username,
      whiteElo: room.whitePlayer.elo,
      blackElo: room.blackPlayer.elo,
      result: room.winner === 'w' ? 'white_won' : room.winner === 'b' ? 'black_won' : 'draw',
      reason: room.winReason || 'Game completed',
      eloChangeWhite: deltaW,
      eloChangeBlack: deltaB,
      totalMoves: room.history.length,
      pgn: room.history.map((m) => m.san).join(' '),
      history: [...room.history],
      timeControlName: room.timeControl.name,
    };

    dbData.matchHistory.unshift(matchItem);
    saveDatabase();
  }

  function handleDisconnect(ws: WebSocket) {
    // Remove from any spectating sets
    activeRoomSpectators.forEach((specSet, roomId) => {
      if (specSet.has(ws)) {
        specSet.delete(ws);
        const room = activeRooms.get(roomId);
        if (room) {
          room.spectatorsCount = specSet.size;
          broadcastRoom(roomId, { type: 'ROOM_STATE', room });
        }
      }
    });

    const userId = socketToUser.get(ws);
    if (!userId) return;

    socketToUser.delete(ws);
    userToSocket.delete(userId);

    // Remove from queue
    const qIdx = matchmakingQueue.findIndex((q) => q.user.id === userId);
    if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);
  }

  // Timer Ticker Loop for Active Games (Decrements active turn clock every second)
  setInterval(() => {
    const now = Date.now();
    activeRooms.forEach((room) => {
      if (room.status === 'active' && room.lastMoveTimestamp) {
        const elapsed = now - room.lastMoveTimestamp;
        room.lastMoveTimestamp = now;

        if (room.turn === 'w') {
          room.whiteTimeLeft = Math.max(0, room.whiteTimeLeft - elapsed);
          if (room.whiteTimeLeft === 0) {
            room.status = 'time_out';
            room.winner = 'b';
            room.winReason = 'White ran out of time';
            finalizeGameOutcome(room);
            broadcastRoom(room.id, { type: 'ROOM_STATE', room });
          }
        } else {
          room.blackTimeLeft = Math.max(0, room.blackTimeLeft - elapsed);
          if (room.blackTimeLeft === 0) {
            room.status = 'time_out';
            room.winner = 'w';
            room.winReason = 'Black ran out of time';
            finalizeGameOutcome(room);
            broadcastRoom(room.id, { type: 'ROOM_STATE', room });
          }
        }
      }
    });
  }, 1000);

  // Serve static build or Vite dev middleware
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
