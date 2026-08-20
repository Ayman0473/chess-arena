export type BoardThemeId = 'classic' | 'forest' | 'ocean' | 'midnight' | 'coral' | 'amethyst';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  lightTile: string;
  darkTile: string;
  lightLabel: string;
  darkLabel: string;
  borderColor: string;
  tagline: string;
}

export type TimeControlCategory = 'bullet' | 'blitz' | 'rapid' | 'custom';

export interface TimeControl {
  initialMinutes: number; // e.g. 5
  incrementSeconds: number; // e.g. 3
  name: string; // e.g. "5+3 Blitz"
}

export type PieceColor = 'w' | 'b';

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  isGuest: boolean;
  elo: number;
  peakElo: number;
  wins: number;
  losses: number;
  draws: number;
  avatarUrl: string;
  joinedAt: number;
}

export interface MoveRecord {
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  piece: string;
  color: PieceColor;
  fen: string;
  captured?: string;
  timeRemaining?: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export type GameStatus =
  | 'waiting'
  | 'active'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned'
  | 'time_out';

export interface GameRoom {
  id: string;
  code: string;
  mode: 'pvp_online' | 'pvp_local' | 'ai';
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  whitePlayer: {
    id: string;
    username: string;
    elo: number;
    avatarUrl: string;
    isGuest: boolean;
    connected: boolean;
  };
  blackPlayer: {
    id: string;
    username: string;
    elo: number;
    avatarUrl: string;
    isGuest: boolean;
    connected: boolean;
  } | null;
  fen: string;
  turn: PieceColor;
  status: GameStatus;
  winner: PieceColor | 'draw' | null;
  winReason?: string;
  timeControl: TimeControl;
  whiteTimeLeft: number; // milliseconds
  blackTimeLeft: number; // milliseconds
  lastMoveTimestamp?: number;
  history: MoveRecord[];
  lastMove: { from: string; to: string; san: string } | null;
  drawOfferedBy: PieceColor | null;
  rematchRequestedBy: PieceColor | null;
  eloChange?: {
    white: number;
    black: number;
  };
  createdAt: number;
  isRated: boolean;
  spectatorsCount?: number;
}

export interface MatchHistoryItem {
  id: string;
  playedAt: number;
  mode: 'pvp_online' | 'pvp_local' | 'ai';
  whitePlayerName: string;
  blackPlayerName: string;
  whiteElo: number;
  blackElo: number;
  result: 'white_won' | 'black_won' | 'draw';
  reason: string;
  eloChangeWhite: number;
  eloChangeBlack: number;
  totalMoves: number;
  pgn: string;
  history?: MoveRecord[];
  timeControlName: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avatarUrl: string;
  isGuest: boolean;
}

// WS Client -> Server Payload Types
export type WSClientMessage =
  | { type: 'AUTH'; user: UserProfile }
  | { type: 'JOIN_QUEUE'; timeControl: TimeControl; isRated: boolean }
  | { type: 'LEAVE_QUEUE' }
  | { type: 'CREATE_ROOM'; mode: 'pvp_online' | 'pvp_local' | 'ai'; timeControl: TimeControl; aiDifficulty?: 'easy' | 'medium' | 'hard'; isRated?: boolean }
  | { type: 'JOIN_ROOM'; roomCode: string }
  | { type: 'MAKE_MOVE'; roomId: string; from: string; to: string; promotion?: string }
  | { type: 'CHAT_MESSAGE'; roomId: string; message: string }
  | { type: 'OFFER_DRAW'; roomId: string }
  | { type: 'RESPOND_DRAW'; roomId: string; accept: boolean }
  | { type: 'RESIGN'; roomId: string }
  | { type: 'REQUEST_REMATCH'; roomId: string }
  | { type: 'RESPOND_REMATCH'; roomId: string; accept: boolean }
  | { type: 'SPECTATE_ROOM'; roomId: string }
  | { type: 'LEAVE_SPECTATE'; roomId: string };

// WS Server -> Client Payload Types
export type WSServerMessage =
  | { type: 'CONNECTED'; userId: string }
  | { type: 'QUEUE_STATUS'; position: number; totalInQueue: number }
  | { type: 'MATCH_FOUND'; roomId: string }
  | { type: 'ROOM_STATE'; room: GameRoom }
  | { type: 'MOVE_MADE'; room: GameRoom; move: MoveRecord }
  | { type: 'CHAT_BROADCAST'; message: ChatMessage }
  | { type: 'GAME_OVER'; room: GameRoom; winner: PieceColor | 'draw' | null; reason: string; updatedUser?: UserProfile }
  | { type: 'LIVE_GAMES_LIST'; games: GameRoom[] }
  | { type: 'ERROR'; message: string };
