import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { PieceColor, BoardThemeId } from '../types';
import { getCapturedPieces, getMaterialDifference } from '../lib/chessEngine';
import { BOARD_THEMES } from '../lib/themes';
import { PIECE_SVGS } from './ChessPieceSvg';
import { Zap, X, History, Radio } from 'lucide-react';

interface ChessBoardProps {
  fen: string;
  onMove: (from: string, to: string, promotion?: string) => void;
  turn: PieceColor;
  orientation?: PieceColor;
  playerColor?: PieceColor;
  themeId?: BoardThemeId;
  disabled?: boolean;
  lastMove?: { from: string; to: string } | null;
  isHistoricalView?: boolean;
  historicalMoveText?: string;
  onReturnToLive?: () => void;
}

// Helper for ordering captured pieces (Pawns, Knights, Bishops, Rooks, Queens)
const PIECE_ORDER: Record<string, number> = {
  p: 1, P: 1,
  n: 2, N: 2,
  b: 3, B: 3,
  r: 4, R: 4,
  q: 5, Q: 5,
};

const CapturedPiecesRow: React.FC<{
  playerColor: 'w' | 'b';
  capturedPieces: string[];
  materialAdvantage: number;
}> = ({ playerColor, capturedPieces, materialAdvantage }) => {
  const sortedPieces = [...capturedPieces].sort(
    (a, b) => (PIECE_ORDER[a] || 0) - (PIECE_ORDER[b] || 0)
  );

  return (
    <div className="w-full max-w-[560px] mx-auto flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border border-slate-800/80 rounded-xl text-xs backdrop-blur-md shadow-md min-h-[38px] transition-all">
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
        {/* Player Color Badge */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/60 px-2 py-0.5 rounded-lg border border-slate-800/80">
          <span
            className={`w-2.5 h-2.5 rounded-full border ${
              playerColor === 'w'
                ? 'bg-slate-100 border-slate-300 shadow-sm'
                : 'bg-slate-900 border-slate-600'
            }`}
          />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            {playerColor === 'w' ? 'White' : 'Black'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-3.5 w-px bg-slate-800 shrink-0" />

        {/* Captured Piece Icons */}
        {sortedPieces.length > 0 ? (
          <div className="flex items-center -space-x-1 sm:-space-x-1.5 py-0.5">
            {sortedPieces.map((piece, idx) => {
              const pieceKey =
                playerColor === 'w'
                  ? `b${piece.toUpperCase()}`
                  : `w${piece.toUpperCase()}`;
              return (
                <div
                  key={idx}
                  className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform hover:scale-125 hover:z-10 drop-shadow"
                  title={`${playerColor === 'w' ? 'Black' : 'White'} ${piece.toUpperCase()}`}
                >
                  {PIECE_SVGS[pieceKey]}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-[10px] text-slate-500 italic">No pieces captured</span>
        )}
      </div>

      {/* Advantage Score Badge */}
      {materialAdvantage > 0 ? (
        <div className="shrink-0 ml-2 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-0.5">
          <span>+{materialAdvantage}</span>
        </div>
      ) : (
        <span className="shrink-0 ml-2 text-[10px] font-mono text-slate-600 font-semibold uppercase">
          =
        </span>
      )}
    </div>
  );
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  onMove,
  turn,
  orientation = 'w',
  playerColor,
  themeId = 'forest',
  disabled = false,
  lastMove,
  isHistoricalView = false,
  historicalMoveText,
  onReturnToLive,
}) => {
  const activeTheme = BOARD_THEMES[themeId] || BOARD_THEMES.forest;
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<Square | null>(null);

  // Pre-move State
  const [premove, setPremove] = useState<{ from: Square; to: Square } | null>(null);
  const [premoveSource, setPremoveSource] = useState<Square | null>(null);

  const activePlayerColor = playerColor || orientation || 'w';
  const isMyTurn = turn === activePlayerColor;

  const chess = new Chess(fen);
  const isCheck = chess.inCheck();

  // Find King in check position
  let kingSquareInCheck: Square | null = null;
  if (isCheck) {
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          kingSquareInCheck = p.square;
          break;
        }
      }
    }
  }

  // Calculate pseudo-legal candidate moves for a pre-move (strictly checking valid chess moves)
  const getPseudoLegalMovesForPremove = (currentFen: string, pColor: PieceColor, square: Square): string[] => {
    try {
      const parts = currentFen.split(' ');
      parts[1] = pColor;
      parts[3] = '-'; // clear en-passant to avoid FEN parsing issues
      const simChess = new Chess(parts.join(' '));
      return simChess.moves({ square, verbose: true }).map((m) => m.to);
    } catch {
      try {
        const simChess = new Chess(currentFen);
        return simChess.moves({ square, verbose: true }).map((m) => m.to);
      } catch {
        return [];
      }
    }
  };

  // Clear transient drag and selection states when position changes
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
    setDraggedSquare(null);
    setDragOverSquare(null);
    setPremoveSource(null);
  }, [fen]);

  // Auto-execute pending pre-move when turn switches back to active player
  useEffect(() => {
    if (premove && isMyTurn && !disabled) {
      const simChess = new Chess(fen);
      const moves = simChess.moves({ square: premove.from, verbose: true });
      const match = moves.find((m) => m.to === premove.to);

      if (match) {
        const piece = simChess.get(premove.from);
        const isPromotion =
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && premove.to[1] === '8') ||
           (piece.color === 'b' && premove.to[1] === '1'));

        onMove(premove.from, premove.to, isPromotion ? 'q' : undefined);
      }

      // Always clear pre-move after turn resolves
      setPremove(null);
      setPremoveSource(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [fen, turn, isMyTurn, disabled]);

  const handleSquareClick = (square: Square) => {
    if (disabled || isHistoricalView) return;

    if (isMyTurn) {
      if (premove) {
        setPremove(null);
        setPremoveSource(null);
      }

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        if (legalMoves.includes(square)) {
          const piece = chess.get(selectedSquare);
          const isPromotion =
            piece &&
            piece.type === 'p' &&
            ((piece.color === 'w' && square[1] === '8') || (piece.color === 'b' && square[1] === '1'));

          if (isPromotion) {
            setPendingPromotion({ from: selectedSquare, to: square });
          } else {
            onMove(selectedSquare, square);
          }

          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }
      }

      const piece = chess.get(square);
      if (piece && piece.color === turn) {
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true }).map((m) => m.to);
        setLegalMoves(moves);
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else {
      // OPPONENT TURN -> STRICT PRE-MOVE LOGIC
      if (premove) {
        setPremove(null);
      }

      const clickedPiece = chess.get(square);

      if (premoveSource) {
        if (premoveSource === square) {
          // Toggle deselect
          setPremoveSource(null);
          setLegalMoves([]);
          return;
        }

        // Only allow premove to highlighted candidate legal squares!
        if (legalMoves.includes(square)) {
          setPremove({ from: premoveSource, to: square });
          setPremoveSource(null);
          setLegalMoves([]);
          return;
        }

        // If clicked on another piece of the player's color, switch selection
        if (clickedPiece && clickedPiece.color === activePlayerColor) {
          setPremoveSource(square);
          const pseudoMoves = getPseudoLegalMovesForPremove(fen, activePlayerColor, square);
          setLegalMoves(pseudoMoves);
          return;
        }

        // Invalid target (not in legal moves, e.g. pawn c2 to e8) -> Cancel selection
        setPremoveSource(null);
        setLegalMoves([]);
      } else {
        if (clickedPiece && clickedPiece.color === activePlayerColor) {
          setPremoveSource(square);
          const pseudoMoves = getPseudoLegalMovesForPremove(fen, activePlayerColor, square);
          setLegalMoves(pseudoMoves);
        } else {
          setPremove(null);
          setPremoveSource(null);
          setLegalMoves([]);
        }
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (disabled || isHistoricalView) return;
    const piece = chess.get(square);
    if (!piece) return;

    if (isMyTurn) {
      if (piece.color !== turn) return;
      setDraggedSquare(square);
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true }).map((m) => m.to);
      setLegalMoves(moves);
    } else {
      if (piece.color !== activePlayerColor) return;
      setDraggedSquare(square);
      setPremoveSource(square);
      const pseudoMoves = getPseudoLegalMovesForPremove(fen, activePlayerColor, square);
      setLegalMoves(pseudoMoves);
    }

    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, square: Square) => {
    if (disabled || isHistoricalView) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSquare !== square) {
      setDragOverSquare(square);
    }
  };

  const handleDragLeave = (e: React.DragEvent, square: Square) => {
    if (dragOverSquare === square) {
      setDragOverSquare(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    if (disabled || isHistoricalView) return;
    e.preventDefault();
    setDragOverSquare(null);

    const fromSquare = draggedSquare || (e.dataTransfer.getData('text/plain') as Square);
    if (!fromSquare || fromSquare === targetSquare) {
      setDraggedSquare(null);
      return;
    }

    if (isMyTurn) {
      const moves = chess.moves({ square: fromSquare, verbose: true }).map((m) => m.to);
      if (moves.includes(targetSquare)) {
        const piece = chess.get(fromSquare);
        const isPromotion =
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && targetSquare[1] === '8') || (piece.color === 'b' && targetSquare[1] === '1'));

        if (isPromotion) {
          setPendingPromotion({ from: fromSquare, to: targetSquare });
        } else {
          onMove(fromSquare, targetSquare);
        }
      }

      setDraggedSquare(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    } else {
      const piece = chess.get(fromSquare);
      if (piece && piece.color === activePlayerColor) {
        const pseudoMoves = getPseudoLegalMovesForPremove(fen, activePlayerColor, fromSquare);
        // Strictly validate that the dropped square is a valid candidate move
        if (pseudoMoves.includes(targetSquare)) {
          setPremove({ from: fromSquare, to: targetSquare });
        }
      }
      setDraggedSquare(null);
      setPremoveSource(null);
      setLegalMoves([]);
    }
  };

  const handleDragEnd = () => {
    setDraggedSquare(null);
    setDragOverSquare(null);
  };

  const handlePromotionSelect = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (pendingPromotion) {
      onMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    }
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayRanks = orientation === 'w' ? ranks : [...ranks].reverse();
  const displayFiles = orientation === 'w' ? files : [...files].reverse();

  // Calculate captured pieces & material difference
  const { whiteCaptured, blackCaptured } = getCapturedPieces(fen);
  const { whiteDiff, blackDiff } = getMaterialDifference(fen);

  const topColor = orientation === 'w' ? 'b' : 'w';
  const bottomColor = orientation === 'w' ? 'w' : 'b';

  const topCapturedPieces = topColor === 'b' ? blackCaptured : whiteCaptured;
  const topAdvantage = topColor === 'b' ? blackDiff : whiteDiff;

  const bottomCapturedPieces = bottomColor === 'w' ? whiteCaptured : blackCaptured;
  const bottomAdvantage = bottomColor === 'w' ? whiteDiff : blackDiff;

  return (
    <div className="w-full max-w-[560px] mx-auto space-y-2">
      {/* Top Player Captured Pieces Row */}
      <CapturedPiecesRow
        playerColor={topColor}
        capturedPieces={topCapturedPieces}
        materialAdvantage={topAdvantage}
      />

      {/* Main Board */}
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setPremove(null);
          setPremoveSource(null);
          setSelectedSquare(null);
          setLegalMoves([]);
        }}
        className="relative select-none w-full max-w-[560px] aspect-square mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 bg-slate-900"
        style={{ borderColor: activeTheme.borderColor }}
      >
      {/* Floating Historical Review Banner */}
      {isHistoricalView && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-950/95 border border-amber-400/80 text-amber-100 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate max-w-[160px] sm:max-w-none">
            {historicalMoveText || 'Reviewing History'}
          </span>
          {onReturnToLive && (
            <button
              onClick={onReturnToLive}
              className="ml-1 px-2 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-transform active:scale-95"
              title="Return to live game position (Shortcut: Down Arrow ↓)"
            >
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>Live (↓)</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Pre-move Banner */}
      {premove && !isHistoricalView && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-purple-950/90 border border-purple-400/60 text-purple-100 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400/30 animate-pulse shrink-0" />
          <span>
            Premove: <span className="text-white font-mono uppercase tracking-wider">{premove.from} → {premove.to}</span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPremove(null);
              setPremoveSource(null);
              setLegalMoves([]);
            }}
            className="ml-1 p-0.5 hover:bg-purple-800/80 rounded-full text-purple-300 hover:text-white transition-colors"
            title="Cancel premove (or right-click board)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Board Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}` as Square;
            const isLight = (rIdx + fIdx) % 2 === 0;
            const piece = chess.get(square);

            const isSelected = isMyTurn ? selectedSquare === square : premoveSource === square;
            const isLegal = legalMoves.includes(square);
            const isPremoveFrom = premove && premove.from === square;
            const isPremoveTo = premove && premove.to === square;
            const isLastMoveFrom = lastMove && lastMove.from === square;
            const isLastMoveTo = lastMove && lastMove.to === square;
            const isKingCheck = kingSquareInCheck === square;
            const isDragOver = dragOverSquare === square;

            const pieceKey = piece ? `${piece.color}${piece.type.toUpperCase()}` : null;
            const isDraggable =
              !disabled &&
              !isHistoricalView &&
              (isMyTurn ? piece?.color === turn : piece?.color === playerColor);

            return (
              <div
                key={square}
                id={`square-${square}`}
                onClick={() => handleSquareClick(square)}
                onDragOver={(e) => handleDragOver(e, square)}
                onDragLeave={(e) => handleDragLeave(e, square)}
                onDrop={(e) => handleDrop(e, square)}
                style={{
                  backgroundColor: isLight ? activeTheme.lightTile : activeTheme.darkTile,
                }}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                  isSelected
                    ? isMyTurn
                      ? 'ring-4 ring-amber-500 z-10 shadow-md !bg-amber-300'
                      : 'ring-4 ring-purple-500 z-10 shadow-md !bg-purple-400/90'
                    : ''
                } ${
                  isPremoveFrom
                    ? 'border-2 border-dashed border-purple-300 ring-2 ring-purple-400 z-10 !bg-purple-600/80'
                    : isPremoveTo
                    ? 'ring-4 ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.7)] z-10 !bg-purple-500/90'
                    : ''
                } ${
                  isDragOver && isLegal
                    ? isMyTurn
                      ? 'ring-4 ring-emerald-400 !bg-emerald-400/50 z-20 scale-[1.02] shadow-xl'
                      : 'ring-4 ring-purple-400 !bg-purple-400/50 z-20 scale-[1.02] shadow-xl'
                    : ''
                } ${
                  isLastMoveFrom
                    ? 'border-2 border-dashed border-amber-500/80 !bg-amber-300/60'
                    : isLastMoveTo
                    ? 'ring-2 ring-amber-500/80 shadow-[inset_0_0_10px_rgba(245,158,11,0.5)] z-1 !bg-amber-400/75'
                    : ''
                } ${isKingCheck ? '!bg-rose-600/90 ring-4 ring-rose-500 z-10 animate-pulse' : ''}`}
              >
                {/* File / Rank Labels */}
                {fIdx === 0 && (
                  <span
                    style={{
                      color: isLight ? activeTheme.lightLabel : activeTheme.darkLabel,
                    }}
                    className="absolute top-0.5 left-1 text-[10px] font-bold z-10 select-none opacity-90"
                  >
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    style={{
                      color: isLight ? activeTheme.lightLabel : activeTheme.darkLabel,
                    }}
                    className="absolute bottom-0.5 right-1 text-[10px] font-bold z-10 select-none opacity-90"
                  >
                    {file}
                  </span>
                )}

                {/* Legal Move & Pre-move Candidate Indicators */}
                {isLegal && !piece && (
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ring-2 shadow-md backdrop-blur-sm transition-transform hover:scale-125 z-10 ${
                      isMyTurn
                        ? 'bg-slate-900/40 dark:bg-slate-950/60 ring-emerald-400/50'
                        : 'bg-purple-950/60 ring-purple-400/60'
                    }`}
                  />
                )}
                {isLegal && piece && (
                  <div
                    className={`absolute inset-0.5 rounded-lg border-4 pointer-events-none z-10 animate-pulse ${
                      isMyTurn
                        ? 'border-rose-500/90 bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                        : 'border-purple-500/90 bg-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                    }`}
                  />
                )}

                {/* Piece Render */}
                {pieceKey && PIECE_SVGS[pieceKey] && (
                  <div
                    draggable={isDraggable}
                    onDragStart={(e) => handleDragStart(e, square)}
                    onDragEnd={handleDragEnd}
                    className={`w-full h-full p-1 sm:p-1.5 transition-transform hover:scale-105 ${
                      isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                  >
                    {PIECE_SVGS[pieceKey]}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pawn Promotion Modal */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center max-w-xs shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1">Promote Pawn</h3>
            <p className="text-xs text-slate-400 mb-4">Select piece for promotion</p>

            <div className="grid grid-cols-4 gap-3">
              {[
                { type: 'q', key: `${turn}Q`, label: 'Queen' },
                { type: 'r', key: `${turn}R`, label: 'Rook' },
                { type: 'b', key: `${turn}B`, label: 'Bishop' },
                { type: 'n', key: `${turn}N`, label: 'Knight' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handlePromotionSelect(item.type as any)}
                  className="p-3 bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group"
                >
                  <div className="w-10 h-10 group-hover:scale-110 transition-transform">
                    {PIECE_SVGS[item.key]}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 group-hover:text-amber-400">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Bottom Player Captured Pieces Row */}
      <CapturedPiecesRow
        playerColor={bottomColor}
        capturedPieces={bottomCapturedPieces}
        materialAdvantage={bottomAdvantage}
      />
    </div>
  );
};
