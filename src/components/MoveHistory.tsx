import React, { useEffect, useRef } from 'react';
import { MoveRecord } from '../types';
import { getCapturedPieces, getMaterialDifference } from '../lib/chessEngine';
import {
  Flag,
  Handshake,
  AlertTriangle,
  Check,
  X,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Radio,
  Keyboard,
} from 'lucide-react';

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
  viewingMoveIndex?: number | null;
  onSelectMoveIndex?: (index: number | null) => void;
  onPrevMove?: () => void;
  onNextMove?: () => void;
  onFirstMove?: () => void;
  onLastMove?: () => void;
  confirmResign?: boolean;
  setConfirmResign?: React.Dispatch<React.SetStateAction<boolean>>;
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
  viewingMoveIndex = null,
  onSelectMoveIndex,
  onPrevMove,
  onNextMove,
  onFirstMove,
  onLastMove,
  confirmResign = false,
  setConfirmResign,
}) => {
  const activeMoveRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { whiteCaptured, blackCaptured } = getCapturedPieces(fen);
  const { whiteDiff, blackDiff } = getMaterialDifference(fen);

  const isOpponentDrawOffer = Boolean(
    drawOfferedBy && (roomMode === 'pvp_local' || (userColor && drawOfferedBy !== userColor))
  );
  const isMyDrawOffer = Boolean(
    drawOfferedBy && roomMode !== 'pvp_local' && userColor && drawOfferedBy === userColor
  );

  // Group moves into white & black pairs with original indices
  const movePairs: {
    moveNumber: number;
    whiteSan?: string;
    whiteIndex?: number;
    blackSan?: string;
    blackIndex?: number;
  }[] = [];

  for (let i = 0; i < history.length; i += 2) {
    const whiteMove = history[i];
    const blackMove = history[i + 1];
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      whiteSan: whiteMove?.san,
      whiteIndex: i,
      blackSan: blackMove?.san,
      blackIndex: i + 1 < history.length ? i + 1 : undefined,
    });
  }

  const isAtLive = viewingMoveIndex === null || viewingMoveIndex === history.length - 1;
  const isAtStart = viewingMoveIndex === -1 || (history.length === 0);

  // Auto scroll active move into view
  useEffect(() => {
    if (activeMoveRef.current && scrollContainerRef.current) {
      activeMoveRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [viewingMoveIndex, history.length]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full min-h-[380px] shadow-xl overflow-hidden">
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

      {/* History Navigation Control Toolbar */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={onFirstMove}
            disabled={history.length === 0 || isAtStart}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-colors"
            title="Start Position (Up Arrow ↑)"
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            onClick={onPrevMove}
            disabled={history.length === 0 || isAtStart}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-colors"
            title="Previous Move (Left Arrow ←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextMove}
            disabled={history.length === 0 || isAtLive}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-colors"
            title="Next Move (Right Arrow →)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onLastMove}
            disabled={history.length === 0 || isAtLive}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800/80 transition-colors"
            title="Current Live Position (Down Arrow ↓)"
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>

        {/* Current Navigation State Indicator */}
        <div className="flex items-center gap-1.5">
          {isAtLive ? (
            <button
              onClick={() => onSelectMoveIndex?.(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider"
              title="Currently viewing live board"
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectMoveIndex?.(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all hover:bg-amber-500/30"
              title="Click or press Down Arrow (↓) to return to live position"
            >
              <span>
                {viewingMoveIndex === -1
                  ? 'Start'
                  : `Move ${viewingMoveIndex! + 1}/${history.length}`}
              </span>
              <span className="text-[9px] underline ml-0.5 opacity-80">Live ↵</span>
            </button>
          )}
        </div>
      </div>

      {/* Move Log Table */}
      <div ref={scrollContainerRef} className="flex-1 p-2 overflow-y-auto max-h-[200px]">
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
            Moves will appear here as game progresses
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-1 px-2 w-10">#</th>
                <th className="py-1 px-2">White</th>
                <th className="py-1 px-2">Black</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {movePairs.map((pair) => {
                const isWhiteActive =
                  viewingMoveIndex !== null
                    ? viewingMoveIndex === pair.whiteIndex
                    : pair.whiteIndex === history.length - 1;
                const isBlackActive =
                  viewingMoveIndex !== null
                    ? viewingMoveIndex === pair.blackIndex
                    : pair.blackIndex === history.length - 1;

                return (
                  <tr key={pair.moveNumber} className="hover:bg-slate-800/30">
                    <td className="py-1 px-2 text-slate-500 font-sans text-[11px]">
                      {pair.moveNumber}.
                    </td>
                    <td className="py-0.5 px-1">
                      {pair.whiteSan && (
                        <button
                          type="button"
                          onClick={() => onSelectMoveIndex?.(pair.whiteIndex!)}
                          ref={isWhiteActive ? activeMoveRef : undefined}
                          className={`w-full text-left px-1.5 py-0.5 rounded transition-colors font-semibold ${
                            isWhiteActive
                              ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                              : 'text-amber-300 hover:bg-slate-800'
                          }`}
                        >
                          {pair.whiteSan}
                        </button>
                      )}
                    </td>
                    <td className="py-0.5 px-1">
                      {pair.blackSan && pair.blackIndex !== undefined && (
                        <button
                          type="button"
                          onClick={() => onSelectMoveIndex?.(pair.blackIndex!)}
                          ref={isBlackActive ? activeMoveRef : undefined}
                          className={`w-full text-left px-1.5 py-0.5 rounded transition-colors font-semibold ${
                            isBlackActive
                              ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                              : 'text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          {pair.blackSan}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Keyboard Shortcuts Helper Line */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between gap-1 select-none">
        <div className="flex items-center gap-1.5 text-slate-400 truncate">
          <Keyboard className="w-3 h-3 text-slate-400 shrink-0" />
          <span>
            <strong className="text-slate-300 font-semibold">Shortcuts:</strong>{' '}
            <kbd className="px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono font-bold">R</kbd> Resign{' '}
            <kbd className="px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono font-bold ml-1">D</kbd> Draw{' '}
            <kbd className="px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono font-bold ml-1">←</kbd>
            <kbd className="px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono font-bold ml-0.5">→</kbd> History
          </span>
        </div>
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
        <div className="p-3 bg-rose-950/90 border-t border-rose-800/80 space-y-2 text-center animate-fadeIn">
          <p className="text-xs font-bold text-rose-200 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Are you sure you want to resign?</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setConfirmResign?.(false);
                onResign?.();
              }}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Confirm Resign</span>
              <kbd className="px-1 py-0.5 text-[9px] bg-rose-800 text-rose-100 rounded font-mono">R</kbd>
            </button>
            <button
              onClick={() => setConfirmResign?.(false)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1"
            >
              <span>Cancel</span>
              <kbd className="px-1 py-0.5 text-[9px] bg-slate-700 text-slate-300 rounded font-mono">Esc</kbd>
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
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-50 group"
              title="Offer a draw to opponent (Shortcut: D)"
            >
              <Handshake className="w-4 h-4 text-amber-400" />
              <span className="truncate">{isMyDrawOffer ? 'Draw Offered...' : 'Offer Draw'}</span>
              <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] bg-slate-900/80 border border-slate-700 text-slate-300 rounded font-mono group-hover:border-amber-500/50">
                D
              </kbd>
            </button>
          )}

          {onResign && (
            <button
              onClick={() => setConfirmResign?.(true)}
              disabled={disabled}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition-colors border border-rose-500/30 flex items-center justify-center gap-1.5 disabled:opacity-50 group"
              title="Resign current game (Shortcut: R)"
            >
              <Flag className="w-4 h-4" />
              <span>Resign</span>
              <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] bg-rose-950/80 border border-rose-800 text-rose-300 rounded font-mono group-hover:border-rose-400">
                R
              </kbd>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

