import React, { useState, useEffect, useRef } from 'react';
import { Timer, AlertCircle } from 'lucide-react';
import { PieceColor } from '../types';

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
}

export const GameClock: React.FC<GameClockProps> = ({
  player,
  color,
  timeLeft,
  isActive,
  isTurn,
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

  return (
    <div
      className={`p-3 sm:p-4 rounded-xl border transition-all flex items-center justify-between ${
        isUnderTenSeconds && isTurn
          ? 'bg-slate-800/90 border-red-500/70 shadow-lg shadow-red-500/10 ring-2 ring-red-500/40'
          : isTurn
          ? 'bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Player Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={player.avatarUrl}
            alt={player.username}
            className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700"
          />
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-[9px] ${
              color === 'w' ? 'bg-amber-100 text-slate-900' : 'bg-slate-800 text-amber-400'
            }`}
          >
            {color.toUpperCase()}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-100">{player.username}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <span>{player.elo} Elo</span>
          </div>
        </div>
      </div>

      {/* Clock Digital Display */}
      <div
        className={`px-4 py-2 rounded-lg font-mono font-bold text-lg sm:text-xl flex items-center gap-2 transition-colors ${
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
  );
};
