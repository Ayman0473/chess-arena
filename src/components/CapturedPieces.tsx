import React from 'react';
import { PieceColor } from '../types';
import { PIECE_SVGS } from './ChessPieceSvg';

interface CapturedPiecesProps {
  playerColor: PieceColor;
  capturedPieces: string[];
  materialAdvantage?: number;
  className?: string;
  compact?: boolean;
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

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  playerColor,
  capturedPieces,
  materialAdvantage = 0,
  className = '',
  compact = false,
}) => {
  // Sort pieces by value (Pawns -> Knights -> Bishops -> Rooks -> Queens)
  const sortedPieces = [...capturedPieces].sort(
    (a, b) => (PIECE_ORDER[a] || 0) - (PIECE_ORDER[b] || 0)
  );

  // Group captured pieces for optional count display and clean visualization
  const pieceCounts: Record<string, number> = {};
  sortedPieces.forEach((p) => {
    const key = p.toLowerCase();
    pieceCounts[key] = (pieceCounts[key] || 0) + 1;
  });

  return (
    <div
      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-md transition-all ${className}`}
    >
      {/* Captured Pieces Collection */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-h-[28px]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Captures
          </span>
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {capturedPieces.length}
          </span>
        </div>

        <div className="h-3.5 w-px bg-slate-800 shrink-0" />

        {sortedPieces.length > 0 ? (
          <div className="flex items-center -space-x-1 sm:-space-x-1.5">
            {sortedPieces.map((piece, idx) => {
              // If playerColor is 'w', this player captured Black pieces (bQ, bR, etc.)
              // If playerColor is 'b', this player captured White pieces (wQ, wR, etc.)
              const opponentPieceKey =
                playerColor === 'w'
                  ? `b${piece.toUpperCase()}`
                  : `w${piece.toUpperCase()}`;

              return (
                <div
                  key={`${piece}-${idx}`}
                  className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 transition-transform hover:scale-125 hover:z-20 drop-shadow-md cursor-help"
                  title={`Captured ${playerColor === 'w' ? 'Black' : 'White'} ${
                    PIECE_NAMES[piece] || piece
                  }`}
                >
                  {PIECE_SVGS[opponentPieceKey]}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 italic">No pieces captured yet</span>
        )}
      </div>

      {/* Material Advantage Badge */}
      <div className="shrink-0 ml-2">
        {materialAdvantage > 0 ? (
          <div className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/10 flex items-center gap-1 animate-fadeIn">
            <span>+{materialAdvantage}</span>
            <span className="text-[9px] uppercase tracking-tight text-amber-400/80 font-sans hidden sm:inline">
              pts
            </span>
          </div>
        ) : (
          <div className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 font-semibold">
            = 0
          </div>
        )}
      </div>
    </div>
  );
};
