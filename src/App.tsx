import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  GameRoom,
  ChatMessage,
  WSClientMessage,
  WSServerMessage,
  TimeControl,
  PieceColor,
  BoardThemeId,
} from './types';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { ChessBoard } from './components/ChessBoard';
import { GameClock } from './components/GameClock';
import { ChatBox } from './components/ChatBox';
import { MoveHistory } from './components/MoveHistory';
import { Leaderboard } from './components/Leaderboard';
import { MatchHistory } from './components/MatchHistory';
import { AuthModal } from './components/AuthModal';
import { RuleGuideModal } from './components/RuleGuideModal';
import { BoardThemePicker } from './components/BoardThemePicker';
import { sounds } from './lib/audio';
import { getStoredBoardTheme, saveStoredBoardTheme, BOARD_THEMES } from './lib/themes';
import { Trophy, Swords, RotateCcw, Home, Sparkles, Handshake, Flag, Eye, Radio, Palette } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard' | 'history' | 'guide'>('play');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>(getStoredBoardTheme());
  const [showInGameThemePicker, setShowInGameThemePicker] = useState(false);

  const handleSelectTheme = (themeId: BoardThemeId) => {
    setBoardTheme(themeId);
    saveStoredBoardTheme(themeId);
  };

  // Active Game State
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inQueue, setInQueue] = useState(false);
  const [queueStatus, setQueueStatus] = useState<{ position: number; totalInQueue: number } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Load persistent user profile from localStorage or create guest
  useEffect(() => {
    const saved = localStorage.getItem('chess_elo_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch {}
    } else {
      // Auto register guest user
      fetch('/api/auth/guest', { method: 'POST' })
        ? fetch('/api/auth/guest', { method: 'POST' })
            .then((res) => res.json())
            .then((data) => {
              if (data.user) {
                setUser(data.user);
                localStorage.setItem('chess_elo_user', JSON.stringify(data.user));
              }
            })
            .catch(() => {})
        : null;
    }
  }, []);

  // Connect WebSocket Server
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (user) {
        sendWS({ type: 'AUTH', user });
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSServerMessage = JSON.parse(event.data);
        handleWSServerMessage(msg);
      } catch (err) {
        console.error('Error handling WS server msg:', err);
      }
    };

    ws.onclose = () => {
      // Reconnect after brief delay
      setTimeout(() => {
        // Retry connection silently
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, [user?.id]);

  const sendWS = (msg: WSClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const handleWSServerMessage = (msg: WSServerMessage) => {
    switch (msg.type) {
      case 'QUEUE_STATUS':
        setInQueue(true);
        setQueueStatus({ position: msg.position, totalInQueue: msg.totalInQueue });
        break;

      case 'MATCH_FOUND':
        setInQueue(false);
        setQueueStatus(null);
        sounds.playVictory();
        break;

      case 'ROOM_STATE':
        const prevStatus = room?.status;
        setRoom(msg.room);

        // Sound triggers for moves / captures / game state transitions
        if (msg.room.history.length > 0) {
          const last = msg.room.history[msg.room.history.length - 1];
          if (last.captured) {
            sounds.playCapture();
          } else {
            sounds.playMove();
          }
        }

        // Game Over sounds
        if (prevStatus === 'active' && msg.room.status !== 'active') {
          if (user && msg.room.winner) {
            const myColor = msg.room.whitePlayer.id === user.id ? 'w' : 'b';
            if (msg.room.winner === myColor) {
              sounds.playVictory();
            } else if (msg.room.winner !== 'draw') {
              sounds.playDefeat();
            }
          }
        }
        break;

      case 'CHAT_BROADCAST':
        setChatMessages((prev) => [...prev, msg.message]);
        if (!msg.message.isSystem) {
          sounds.playChatSound();
        }
        break;

      case 'ERROR':
        console.warn('Server Error:', msg.message);
        break;
    }
  };

  const handleUserAuth = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('chess_elo_user', JSON.stringify(newUser));
    sendWS({ type: 'AUTH', user: newUser });
  };

  const handleLogout = () => {
    localStorage.removeItem('chess_elo_user');
    setUser(null);
    setIsAuthOpen(true);
  };

  // Lobby Handlers
  const handleJoinQueue = (tc: TimeControl, isRated: boolean) => {
    setInQueue(true);
    sendWS({ type: 'JOIN_QUEUE', timeControl: tc, isRated });
  };

  const handleLeaveQueue = () => {
    setInQueue(false);
    setQueueStatus(null);
    sendWS({ type: 'LEAVE_QUEUE' });
  };

  const handleCreateRoom = (
    mode: 'pvp_online' | 'pvp_local' | 'ai',
    tc: TimeControl,
    aiDifficulty?: 'easy' | 'medium' | 'hard',
    isRated?: boolean
  ) => {
    setIsSpectator(false);
    setChatMessages([]);
    sendWS({ type: 'CREATE_ROOM', mode, timeControl: tc, aiDifficulty, isRated });
  };

  const handleJoinRoomCode = (code: string) => {
    setIsSpectator(false);
    setChatMessages([]);
    sendWS({ type: 'JOIN_ROOM', roomCode: code });
  };

  const handleSpectateRoom = (roomId: string) => {
    setIsSpectator(true);
    setChatMessages([]);
    sendWS({ type: 'SPECTATE_ROOM', roomId });
  };

  // Game Board Move Handler
  const handleMove = (from: string, to: string, promotion?: string) => {
    if (!room || isSpectator) return;
    sendWS({ type: 'MAKE_MOVE', roomId: room.id, from, to, promotion });
  };

  const handleSendMessage = (message: string) => {
    if (!room) return;
    sendWS({ type: 'CHAT_MESSAGE', roomId: room.id, message });
  };

  const handleOfferDraw = () => {
    if (!room || isSpectator) return;
    sendWS({ type: 'OFFER_DRAW', roomId: room.id });
  };

  const handleRespondDraw = (accept: boolean) => {
    if (!room || isSpectator) return;
    sendWS({ type: 'RESPOND_DRAW', roomId: room.id, accept });
  };

  const handleResign = () => {
    if (!room || isSpectator) return;
    sendWS({ type: 'RESIGN', roomId: room.id });
  };

  const handleRequestRematch = () => {
    if (!room || isSpectator) return;
    sendWS({ type: 'REQUEST_REMATCH', roomId: room.id });
  };

  const handleRespondRematch = (accept: boolean) => {
    if (!room || isSpectator) return;
    sendWS({ type: 'RESPOND_REMATCH', roomId: room.id, accept });
  };

  const handleLeaveGame = () => {
    if (isSpectator && room) {
      sendWS({ type: 'LEAVE_SPECTATE', roomId: room.id });
    }
    setIsSpectator(false);
    setRoom(null);
    setChatMessages([]);
    setViewingMoveIndex(null);
    setConfirmResign(false);
  };

  // Move History Navigation State
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);

  // Reset viewing index when room changes or rematch restarts
  useEffect(() => {
    setViewingMoveIndex(null);
    setConfirmResign(false);
  }, [room?.id, room?.status]);

  // History Navigation Helpers
  const handlePrevMove = () => {
    if (!room || room.history.length === 0) return;
    setViewingMoveIndex((curr) => {
      if (curr === null) {
        return room.history.length >= 2 ? room.history.length - 2 : -1;
      }
      if (curr > -1) {
        return curr - 1;
      }
      return -1;
    });
  };

  const handleNextMove = () => {
    if (!room || room.history.length === 0) return;
    setViewingMoveIndex((curr) => {
      if (curr === null) return null;
      if (curr < room.history.length - 1) {
        return curr + 1;
      }
      return null; // Return to live position
    });
  };

  const handleFirstMove = () => {
    if (!room || room.history.length === 0) return;
    setViewingMoveIndex(-1);
  };

  const handleLastMove = () => {
    setViewingMoveIndex(null);
  };

  const handleSelectMoveIndex = (index: number | null) => {
    setViewingMoveIndex(index);
  };

  // Determine Player Color for Current User
  let userColor: PieceColor = 'w';
  if (room && user) {
    if (room.blackPlayer && room.blackPlayer.id === user.id) {
      userColor = 'b';
    }
  }

  // Active interaction player color for the chessboard (in local mode, whoever's turn it is can move)
  const boardPlayerColor: PieceColor =
    room?.mode === 'pvp_local' ? (room.turn as PieceColor) : userColor;

  const isMyTurn = room ? (room.mode === 'pvp_local' ? true : room.turn === userColor) : false;

  // Compute displayed board state (live or historical position)
  const isHistoricalView =
    viewingMoveIndex !== null &&
    (viewingMoveIndex === -1 || viewingMoveIndex < (room?.history.length ?? 0) - 1);

  let displayedFen = room?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  let displayedLastMove: { from: string; to: string } | null = room?.lastMove || null;
  let displayedTurn = room?.turn || 'w';
  let historicalMoveText = '';

  if (room && viewingMoveIndex !== null) {
    if (viewingMoveIndex === -1) {
      displayedFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      displayedLastMove = null;
      displayedTurn = 'w';
      historicalMoveText = 'Starting Position';
    } else if (viewingMoveIndex >= 0 && viewingMoveIndex < room.history.length) {
      const rec = room.history[viewingMoveIndex];
      displayedFen = rec.fen;
      displayedLastMove = { from: rec.from, to: rec.to };
      displayedTurn = rec.color === 'w' ? 'b' : 'w';
      historicalMoveText = `Move ${viewingMoveIndex + 1}/${room.history.length} (${rec.color === 'w' ? 'White' : 'Black'}: ${rec.san})`;
    }
  }

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore keystrokes when typing in inputs/textareas
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // If Auth modal is open, do not trigger shortcuts
      if (isAuthOpen) return;

      // Shortcuts only operate within a Game Room
      if (!room) return;

      // History navigation: Left/Right/Up/Down Arrow Keys
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMove();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMove();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleFirstMove();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleLastMove();
        return;
      }

      // Action Shortcuts (R: Resign, D: Draw) - only active for players in active game
      if (isSpectator || room.status !== 'active') return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (!confirmResign) {
          setConfirmResign(true);
        } else {
          handleResign();
          setConfirmResign(false);
        }
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (room.drawOfferedBy) {
          if (room.mode === 'pvp_local' || room.drawOfferedBy !== userColor) {
            handleRespondDraw(true);
          }
        } else {
          handleOfferDraw();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (confirmResign) {
          setConfirmResign(false);
        } else if (viewingMoveIndex !== null) {
          setViewingMoveIndex(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [room, isSpectator, userColor, confirmResign, viewingMoveIndex, isAuthOpen]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTheme={boardTheme}
        onSelectTheme={handleSelectTheme}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6">
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'history' && <MatchHistory user={user} onOpenAuth={() => setIsAuthOpen(true)} />}
        {activeTab === 'guide' && <RuleGuideModal />}

        {activeTab === 'play' && (
          <>
            {!room ? (
              <Lobby
                user={user}
                currentTheme={boardTheme}
                onSelectTheme={handleSelectTheme}
                onJoinQueue={handleJoinQueue}
                onLeaveQueue={handleLeaveQueue}
                onCreateRoom={handleCreateRoom}
                onJoinRoomCode={handleJoinRoomCode}
                onSpectateRoom={handleSpectateRoom}
                inQueue={inQueue}
                queueStatus={queueStatus}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            ) : (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Game Room Top Info Bar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg relative">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleLeaveGame}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      <span className="hidden sm:inline">Lobby</span>
                    </button>
                    <div className="h-4 w-px bg-slate-800" />
                    <div>
                      <span className="text-xs font-bold text-slate-200">
                        Room Code: <span className="font-mono text-emerald-400">{room.code}</span>
                      </span>
                      <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {room.timeControl.name}
                      </span>
                    </div>
                  </div>

                  {/* Mid-Game Theme Toggle & Spectator / Draw Indicator */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* In-Game Theme Picker Popover */}
                    <div className="relative">
                      <button
                        id="in-game-theme-button"
                        onClick={() => setShowInGameThemePicker(!showInGameThemePicker)}
                        title="Change Board Theme"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all hover:border-amber-500/50"
                      >
                        <Palette className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">{BOARD_THEMES[boardTheme]?.name || 'Theme'}</span>
                        <div className="w-3.5 h-3.5 rounded overflow-hidden grid grid-cols-2 grid-rows-2 shadow border border-black/30 shrink-0">
                          <div style={{ backgroundColor: BOARD_THEMES[boardTheme]?.lightTile || '#eeeed2' }} />
                          <div style={{ backgroundColor: BOARD_THEMES[boardTheme]?.darkTile || '#769656' }} />
                          <div style={{ backgroundColor: BOARD_THEMES[boardTheme]?.darkTile || '#769656' }} />
                          <div style={{ backgroundColor: BOARD_THEMES[boardTheme]?.lightTile || '#eeeed2' }} />
                        </div>
                      </button>

                      {showInGameThemePicker && (
                        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Palette className="w-3.5 h-3.5 text-amber-400" />
                              <span>Select Board Theme</span>
                            </div>
                            <span className="text-[10px] text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-slate-800">
                              Instant Live Preview
                            </span>
                          </div>
                          <BoardThemePicker
                            currentTheme={boardTheme}
                            onSelectTheme={(t) => {
                              handleSelectTheme(t);
                              setShowInGameThemePicker(false);
                            }}
                            variant="compact"
                          />
                        </div>
                      )}
                    </div>

                    {/* Spectator Indicator Badge */}
                    {isSpectator && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold animate-pulse">
                        <Radio className="w-4 h-4" />
                        <span className="hidden sm:inline">LIVE SPECTATOR</span>
                        <span className="ml-1 text-[11px] font-mono opacity-80 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {room.spectatorsCount || 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Draw Offer Notification Banner */}
                  {!isSpectator && room.drawOfferedBy && (room.mode === 'pvp_local' || room.drawOfferedBy !== userColor) && (
                    <div className="flex items-center gap-2.5 bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 rounded-xl shadow-lg animate-fadeIn">
                      <Handshake className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                      <span className="text-xs font-extrabold text-amber-300">
                        {room.mode === 'pvp_local'
                          ? `${room.drawOfferedBy === 'w' ? 'White' : 'Black'} offered a draw!`
                          : 'Opponent offered a draw!'}
                      </span>
                      <button
                        onClick={() => handleRespondDraw(true)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondDraw(false)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* 3-Column Responsive Game Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Opponent Clock & Move Notation */}
                  <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
                    {/* Opponent Clock */}
                    {userColor === 'w' ? (
                      <GameClock
                        key={`opponent-clock-black-${room.id}`}
                        player={
                          room.blackPlayer || {
                            username: 'Waiting for opponent...',
                            elo: 1200,
                            avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=waiting',
                          }
                        }
                        color="b"
                        timeLeft={room.blackTimeLeft}
                        isActive={room.status === 'active'}
                        isTurn={room.turn === 'b'}
                      />
                    ) : (
                      <GameClock
                        key={`opponent-clock-white-${room.id}`}
                        player={room.whitePlayer}
                        color="w"
                        timeLeft={room.whiteTimeLeft}
                        isActive={room.status === 'active'}
                        isTurn={room.turn === 'w'}
                      />
                    )}

                    {/* Move Notation & Actions */}
                    <MoveHistory
                      history={room.history}
                      fen={displayedFen}
                      roomMode={room.mode}
                      onOfferDraw={!isSpectator && room.status === 'active' ? handleOfferDraw : undefined}
                      onRespondDraw={!isSpectator && room.status === 'active' ? handleRespondDraw : undefined}
                      onResign={!isSpectator && room.status === 'active' ? handleResign : undefined}
                      drawOfferedBy={room.drawOfferedBy}
                      userColor={userColor}
                      currentTurnColor={room.turn}
                      disabled={isSpectator || room.status !== 'active'}
                      viewingMoveIndex={viewingMoveIndex}
                      onSelectMoveIndex={handleSelectMoveIndex}
                      onPrevMove={handlePrevMove}
                      onNextMove={handleNextMove}
                      onFirstMove={handleFirstMove}
                      onLastMove={handleLastMove}
                      confirmResign={confirmResign}
                      setConfirmResign={setConfirmResign}
                    />
                  </div>

                  {/* Center Column: Interactive Chess Board */}
                  <div className="lg:col-span-6 space-y-4 order-1 lg:order-2 flex flex-col items-center">
                    <ChessBoard
                      fen={displayedFen}
                      onMove={handleMove}
                      turn={displayedTurn}
                      orientation={userColor}
                      playerColor={boardPlayerColor}
                      themeId={boardTheme}
                      disabled={isSpectator || room.status !== 'active'}
                      lastMove={displayedLastMove}
                      isHistoricalView={isHistoricalView}
                      historicalMoveText={historicalMoveText}
                      onReturnToLive={handleLastMove}
                    />
                  </div>

                  {/* Right Column: Player Clock & Real-time Chat */}
                  <div className="lg:col-span-3 space-y-4 order-3 lg:order-3">
                    {/* Active Player Clock */}
                    {userColor === 'w' ? (
                      <GameClock
                        key={`player-clock-white-${room.id}`}
                        player={room.whitePlayer}
                        color="w"
                        timeLeft={room.whiteTimeLeft}
                        isActive={room.status === 'active'}
                        isTurn={room.turn === 'w'}
                      />
                    ) : (
                      <GameClock
                        key={`player-clock-black-${room.id}`}
                        player={
                          room.blackPlayer || {
                            username: 'Player 2',
                            elo: 1200,
                            avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=p2',
                          }
                        }
                        color="b"
                        timeLeft={room.blackTimeLeft}
                        isActive={room.status === 'active'}
                        isTurn={room.turn === 'b'}
                      />
                    )}

                    {/* Live Chat Component */}
                    <ChatBox
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      currentUser={user}
                    />
                  </div>
                </div>

                {/* Game Over Modal / Result Banner */}
                {room.status !== 'active' && room.status !== 'waiting' && (
                  <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5 relative">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center mx-auto text-slate-950 shadow-xl shadow-amber-500/20">
                        <Trophy className="w-8 h-8 stroke-[2.5]" />
                      </div>

                      <div>
                        <h2 className="text-2xl font-black text-slate-100 tracking-tight">
                          {room.winner === 'draw'
                            ? 'Game Draw!'
                            : room.winner === userColor
                            ? 'VICTORY!'
                            : 'DEFEAT'}
                        </h2>
                        <p className="text-xs text-amber-400 font-bold mt-1">
                          Reason: {room.winReason || 'Game Finished'}
                        </p>
                      </div>

                      {/* Elo Delta Box */}
                      {room.eloChange && (
                        <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Elo Rating Update
                          </div>
                          <div className="flex items-center justify-around font-mono font-bold text-sm">
                            <div>
                              <span className="text-slate-300">{room.whitePlayer.username}: </span>
                              <span
                                className={
                                  room.eloChange.white >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {room.eloChange.white >= 0
                                  ? `+${room.eloChange.white}`
                                  : room.eloChange.white}{' '}
                                Elo
                              </span>
                            </div>
                            {room.blackPlayer && (
                              <div>
                                <span className="text-slate-300">{room.blackPlayer.username}: </span>
                                <span
                                  className={
                                    room.eloChange.black >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }
                                >
                                  {room.eloChange.black >= 0
                                    ? `+${room.eloChange.black}`
                                    : room.eloChange.black}{' '}
                                  Elo
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Rematch & Lobby Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {room.rematchRequestedBy && room.rematchRequestedBy !== userColor ? (
                          <button
                            onClick={() => handleRespondRematch(true)}
                            className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
                          >
                            Accept Rematch
                          </button>
                        ) : (
                          <button
                            onClick={handleRequestRematch}
                            disabled={Boolean(room.rematchRequestedBy)}
                            className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>
                              {room.rematchRequestedBy ? 'Rematch Requested' : 'Rematch'}
                            </span>
                          </button>
                        )}

                        <button
                          onClick={handleLeaveGame}
                          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
                        >
                          <Home className="w-4 h-4" />
                          <span>Return to Lobby</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleUserAuth}
      />
    </div>
  );
}
