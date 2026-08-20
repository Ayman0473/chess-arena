import React, { useState, useEffect } from 'react';
import { Timer, AlertCircle } from 'lucide-react';
import { PieceColor } from '../types';
import { PIECE_SVGS } from './ChessPieceSvg';

interface GameClockProps {
  player: {
    username: string;
    elo: number;
    avatarUrl: string;
  };
  color: PieceColor;
  timeLeft: number; // in milliseconds
  isActive: boolean;
  isTurn: boolean;
  capturedPieces?: string[];
  materialAdvantage?: number;
}

const PIECE_ORDER: Record<string, number> = {
  p: 1, P: 1,
  n: 2, N: 2,
  b: 3, B: 3,
  r: 4, R: 4,
  q: 5, Q: 5,
};

const PIECE_NAMES: Record<string, string> = {
  p: 'Pawn', P: 'Pawn',
  n: 'Knight', N: 'Knight',
  b: 'Bishop', B: 'Bishop',
  r: 'Rook', R: 'Rook',
  q: 'Queen', Q: 'Queen',
};

export const GameClock: React.FC<GameClockProps> = ({
  player,
  color,
  timeLeft,
  isActive,
  isTurn,
  capturedPieces,
  materialAdvantage = 0,
}) => {
  const [displayTime, setDisplayTime] = useState(timeLeft);

  // Sync state whenever timeLeft updates from server or turn changes
  useEffect(() => {
    setDisplayTime(timeLeft);
  }, [timeLeft]);

  // Continuously count down when game is active and it's this player's turn
  useEffect(() => {
    if (!isActive || !isTurn) {
      setDisplayTime(timeLeft);
      return;
    }

    const startTimestamp = Date.now();
    const baseTime = timeLeft;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimestamp;
      const remaining = Math.max(0, baseTime - elapsed);
      setDisplayTime(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, isTurn, timeLeft]);

  const totalSeconds = Math.max(0, Math.floor(displayTime / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  if (totalSeconds < 10) {
    const tenths = Math.floor((Math.max(0, displayTime) % 1000) / 100);
    formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  }

  const isUnderTenSeconds = totalSeconds < 10 && isActive && displayTime > 0;
  const isLowTime = totalSeconds <= 30 && isActive;

  // Sorted list of captured pieces
  const sortedPieces = capturedPieces
    ? [...capturedPieces].sort((a, b) => (PIECE_ORDER[a] || 0) - (PIECE_ORDER[b] || 0))
    : [];

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden shadow-lg ${
        isUnderTenSeconds && isTurn
          ? 'bg-slate-900/95 border-red-500/70 shadow-red-500/10 ring-2 ring-red-500/40'
          : isTurn
          ? 'bg-slate-900/95 border-amber-500/60 shadow-amber-500/10 ring-2 ring-amber-500/30'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Top Main Clock Row */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
        {/* Player Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={player.avatarUrl}
              alt={player.username}
              className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 object-cover"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-[9px] ${
                color === 'w' ? 'bg-amber-100 text-slate-900' : 'bg-slate-800 text-amber-400'
              }`}
            >
              {color.toUpperCase()}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100 truncate">{player.username}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              <span>{player.elo} Elo</span>
            </div>
          </div>
        </div>

        {/* Clock Digital Display */}
        <div
          className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono font-bold text-lg sm:text-xl flex items-center gap-2 transition-colors shrink-0 ${
            isUnderTenSeconds
              ? 'bg-red-500/20 text-red-500 border border-red-500/60 shadow-md shadow-red-500/20 animate-subtle-shake font-extrabold'
              : isLowTime
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
              : isTurn
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {isUnderTenSeconds ? (
            <AlertCircle className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
          ) : isLowTime ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Timer className="w-4 h-4 opacity-70 shrink-0" />
          )}
          <span className={isUnderTenSeconds ? 'text-red-500' : undefined}>{formattedTime}</span>
        </div>
      </div>

      {/* Bottom Tray: Captured Pieces & Material Advantage */}
      {capturedPieces !== undefined && (
        <div className="px-3 sm:px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2 min-h-[38px]">
          {/* Captured Pieces List */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0">
              Captures
            </span>

            {sortedPieces.length > 0 ? (
              <div className="flex items-center -space-x-1 sm:-space-x-1.5 py-0.5">
                {sortedPieces.map((piece, idx) => {
                  const pieceKey =
                    color === 'w'
                      ? `b${piece.toUpperCase()}`
                      : `w${piece.toUpperCase()}`;

                  return (
                    <div
                      key={`${piece}-${idx}`}
                      className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform hover:scale-125 hover:z-20 drop-shadow cursor-pointer"
                      title={`Captured ${color === 'w' ? 'Black' : 'White'} ${
                        PIECE_NAMES[piece] || piece
                      }`}
                    >
                      {PIECE_SVGS[pieceKey]}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 italic truncate">None</span>
            )}
          </div>

          {/* Material Advantage Score */}
          <div className="shrink-0">
            {materialAdvantage > 0 ? (
              <div className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm flex items-center gap-0.5 animate-fadeIn">
                <span>+{materialAdvantage}</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-slate-600 font-semibold px-1">=</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

