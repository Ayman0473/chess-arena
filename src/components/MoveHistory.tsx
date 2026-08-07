import React, { useState } from 'react';
import { MoveRecord } from '../types';
import { getCapturedPieces, getMaterialDifference } from '../lib/chessEngine';
import { Flag, Handshake, AlertTriangle, Check, X } from 'lucide-react';

interface MoveHistoryProps {
  history: MoveRecord[];
  fen: string;
  roomMode?: string;
  onOfferDraw?: () => void;
  onRespondDraw?: (accept: boolean) => void;
  onResign?: () => void;
  drawOfferedBy?: string | null;
  userColor?: string;
  currentTurnColor?: string;
  disabled?: boolean;
}

const PIECE_UNICODE: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
  P: '♙',
  N: '♘',
  B: '♗',
  R: '♖',
  Q: '♕',
  K: '♔',
};

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  fen,
  roomMode,
  onOfferDraw,
  onRespondDraw,
  onResign,
  drawOfferedBy,
  userColor,
  disabled = false,
}) => {
  const [confirmResign, setConfirmResign] = useState(false);
  const { whiteCaptured, blackCaptured } = getCapturedPieces(fen);
  const { whiteDiff, blackDiff } = getMaterialDifference(fen);

  const isOpponentDrawOffer = Boolean(
    drawOfferedBy && (roomMode === 'pvp_local' || (userColor && drawOfferedBy !== userColor))
  );
  const isMyDrawOffer = Boolean(
    drawOfferedBy && roomMode !== 'pvp_local' && userColor && drawOfferedBy === userColor
  );

  // Group moves into white & black pairs
  const movePairs: { moveNumber: number; whiteSan?: string; blackSan?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    const whiteMove = history[i];
    const blackMove = history[i + 1];
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      whiteSan: whiteMove?.san,
      blackSan: blackMove?.san,
    });
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full min-h-[360px] shadow-xl overflow-hidden">
      {/* Captured Pieces Bar */}
      <div className="p-3 bg-slate-800/60 border-b border-slate-800 space-y-2">
        {/* Black Captured Pieces (by White) */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-mono text-base text-slate-100 min-h-[24px]">
            {whiteCaptured.map((p, idx) => (
              <span key={idx} className="drop-shadow">
                {PIECE_UNICODE[p]}
              </span>
            ))}
          </div>
          {whiteDiff > 0 && (
            <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              +{whiteDiff}
            </span>
          )}
        </div>

        {/* White Captured Pieces (by Black) */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1 font-mono text-base text-slate-400 min-h-[24px]">
            {blackCaptured.map((p, idx) => (
              <span key={idx} className="drop-shadow">
                {PIECE_UNICODE[p]}
              </span>
            ))}
          </div>
          {blackDiff > 0 && (
            <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              +{blackDiff}
            </span>
          )}
        </div>
      </div>

      {/* Move Log Table */}
      <div className="flex-1 p-2 overflow-y-auto max-h-[220px]">
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
            Moves will appear here as game progresses
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-1.5 px-2 w-12">#</th>
                <th className="py-1.5 px-2">White</th>
                <th className="py-1.5 px-2">Black</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {movePairs.map((pair) => (
                <tr key={pair.moveNumber} className="hover:bg-slate-800/40">
                  <td className="py-1.5 px-2 text-slate-500">{pair.moveNumber}.</td>
                  <td className="py-1.5 px-2 font-semibold text-amber-300">{pair.whiteSan || ''}</td>
                  <td className="py-1.5 px-2 font-semibold text-slate-200">{pair.blackSan || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Incoming Opponent Draw Offer Alert Banner inside panel */}
      {isOpponentDrawOffer && (
        <div className="p-3 bg-amber-500/15 border-t border-amber-500/30 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
            <Handshake className="w-4 h-4 text-amber-400" />
            <span>Opponent Offered a Draw!</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRespondDraw?.(true)}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Accept Draw</span>
            </button>
            <button
              onClick={() => onRespondDraw?.(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      )}

      {/* Resign Confirmation Inline Box */}
      {confirmResign && (
        <div className="p-3 bg-rose-950/80 border-t border-rose-800/80 space-y-2 text-center animate-fadeIn">
          <p className="text-xs font-bold text-rose-200 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Are you sure you want to resign?</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setConfirmResign(false);
                onResign?.();
              }}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Yes, Resign</span>
            </button>
            <button
              onClick={() => setConfirmResign(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors border border-slate-700"
            >
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Standard Actions (Draw Offer & Resign) */}
      {!confirmResign && !isOpponentDrawOffer && (onOfferDraw || onResign) && (
        <div className="p-3 bg-slate-800/80 border-t border-slate-800 grid grid-cols-2 gap-2">
          {onOfferDraw && (
            <button
              onClick={onOfferDraw}
              disabled={disabled || Boolean(drawOfferedBy)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Handshake className="w-4 h-4 text-amber-400" />
              <span>{isMyDrawOffer ? 'Draw Offered...' : 'Offer Draw'}</span>
            </button>
          )}

          {onResign && (
            <button
              onClick={() => setConfirmResign(true)}
              disabled={disabled}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Flag className="w-4 h-4" />
              <span>Resign</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
