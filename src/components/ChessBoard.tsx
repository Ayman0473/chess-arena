import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { PieceColor } from '../types';
import { Zap, X } from 'lucide-react';

interface ChessBoardProps {
  fen: string;
  onMove: (from: string, to: string, promotion?: string) => void;
  turn: PieceColor;
  orientation?: PieceColor;
  disabled?: boolean;
  lastMove?: { from: string; to: string } | null;
}

// SVG Vector rendering for standard Staunton Chess Pieces
const PIECE_SVGS: Record<string, React.ReactNode> = {
  // White Pieces
  wK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path d="M22.5 11.63V6M20 8h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M22.5 25c-4 0-7.5 1.5-10 4 0 0 2.5 2.5 10 2.5s10-2.5 10-2.5c-2.5-2.5-6-4-10-4z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M11.5 37c5.5 3.5 16.5 3.5 22 0v-3c0 0-3-1.5-11-1.5s-11 1.5-11 1.5v3z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M12.5 30c5.5-2.5 14.5-2.5 20 0v-2c0 0-3-2.5-10-2.5s-10 2.5-10 2.5v2z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M22.5 11.5c-4.14 0-7.5 3.36-7.5 7.5 0 2.5 1.25 4.7 3.17 6.04 1.22.85 2.7 1.46 4.33 1.46s3.11-.61 4.33-1.46c1.92-1.34 3.17-3.54 3.17-6.04 0-4.14-3.36-7.5-7.5-7.5z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),
  wQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5h24s0-1.5-1.5-2.5c-.5-2.5-.5-2 0-3.5 1-2 2.5-2 2.5-4-2.5-2-4.5 0-6.5 2-1.5 1.5-2 1.5-3.5 1.5s-2 0-3.5-1.5c-2-2-4-4-6.5-2z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M9 26c0 2 1.5 2 2.5 4M36 26c0 2-1.5 2-2.5 4"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M11.5 30c3.5-1 6.5-1 11 0M11.5 33.5c3.5-1 6.5-1 11 0"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <circle cx="9" cy="16" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="15.75" cy="13" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="22.5" cy="11" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="29.25" cy="13" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="36" cy="16" r="2" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <path
        d="M9 16l3 10M15.75 13l2 13M22.5 11v15M29.25 13l-2 13M36 16l-3 10"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),
  wR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M9 39h27v-3H9v3zM12 36h21v-4H12v4zM11 14h23l-2 4H13l-2-4zM14 18h17v10H14V18zM12 28h21v4H12v-4z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M9 14l3-5h4v3h3V9h4v3h3V9h4l3 5H9z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),
  wB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="#fff" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M9 36h27v-3H9v3zM12 33h21v-3H12v3zM11 27h23l-2 3H13l-2-3z" />
        <path d="M22.5 10a7.5 7.5 0 0 0-7.5 7.5c0 2.5 1.5 5 3.5 6.5s3 3 4 3 2-1.5 4-3 3.5-4 3.5-6.5a7.5 7.5 0 0 0-7.5-7.5z" />
        <path d="M17.5 26h10" />
      </g>
      <circle cx="22.5" cy="8" r="1.5" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M20 12h5M22.5 9.5v5" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  ),
  wN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-12-1-2.5-3-1-4.5 1-1.5 2-1.5 2-3 2.5s-2.5 1.5-2 4c.5 2.5.5 2.5-1 3.5s-2.5.5-3-1.5c-.5-2 0-3 1.5-4.5s4-3.5 3-7c-1-3.5-3-5.5-3-5.5s1-1 4.5-1.5c3.5-.5 5 0 7.5 2z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <circle cx="27" cy="18" r="1.5" fill="#1e293b" />
    </svg>
  ),
  wP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 13 30.13 13 34h19c0-3.87-2.41-6.91-5.41-7.97C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill="#fff"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),

  // Black Pieces
  bK: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path d="M22.5 11.63V6M20 8h5" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M22.5 25c-4 0-7.5 1.5-10 4 0 0 2.5 2.5 10 2.5s10-2.5 10-2.5c-2.5-2.5-6-4-10-4z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M11.5 37c5.5 3.5 16.5 3.5 22 0v-3c0 0-3-1.5-11-1.5s-11 1.5-11 1.5v3z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M12.5 30c5.5-2.5 14.5-2.5 20 0v-2c0 0-3-2.5-10-2.5s-10 2.5-10 2.5v2z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path
        d="M22.5 11.5c-4.14 0-7.5 3.36-7.5 7.5 0 2.5 1.25 4.7 3.17 6.04 1.22.85 2.7 1.46 4.33 1.46s3.11-.61 4.33-1.46c1.92-1.34 3.17-3.54 3.17-6.04 0-4.14-3.36-7.5-7.5-7.5z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path d="M20 8h5M22.5 6v5.5" stroke="#fbbf24" strokeWidth="1.5" />
    </svg>
  ),
  bQ: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5h24s0-1.5-1.5-2.5c-.5-2.5-.5-2 0-3.5 1-2 2.5-2 2.5-4-2.5-2-4.5 0-6.5 2-1.5 1.5-2 1.5-3.5 1.5s-2 0-3.5-1.5c-2-2-4-4-6.5-2z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <circle cx="9" cy="16" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="15.75" cy="13" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="22.5" cy="11" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="29.25" cy="13" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="36" cy="16" r="2" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  ),
  bR: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M9 39h27v-3H9v3zM12 36h21v-4H12v4zM11 14h23l-2 4H13l-2-4zM14 18h17v10H14V18zM12 28h21v4H12v-4z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <path d="M9 14l3-5h4v3h3V9h4v3h3V9h4l3 5H9z" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  ),
  bB: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <g fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M9 36h27v-3H9v3zM12 33h21v-3H12v3zM11 27h23l-2 3H13l-2-3z" />
        <path d="M22.5 10a7.5 7.5 0 0 0-7.5 7.5c0 2.5 1.5 5 3.5 6.5s3 3 4 3 2-1.5 4-3 3.5-4 3.5-6.5a7.5 7.5 0 0 0-7.5-7.5z" />
      </g>
      <circle cx="22.5" cy="8" r="1.5" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  ),
  bN: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-12-1-2.5-3-1-4.5 1-1.5 2-1.5 2-3 2.5s-2.5 1.5-2 4c.5 2.5.5 2.5-1 3.5s-2.5.5-3-1.5c-.5-2 0-3 1.5-4.5s4-3.5 3-7c-1-3.5-3-5.5-3-5.5s1-1 4.5-1.5c3.5-.5 5 0 7.5 2z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <circle cx="27" cy="18" r="1.5" fill="#fbbf24" />
    </svg>
  ),
  bP: (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow">
      <path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 13 30.13 13 34h19c0-3.87-2.41-6.91-5.41-7.97C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill="#1e293b"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
    </svg>
  ),
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  onMove,
  turn,
  orientation = 'w',
  disabled = false,
  lastMove,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<Square | null>(null);

  // Pre-move State
  const [premove, setPremove] = useState<{ from: Square; to: Square } | null>(null);
  const [premoveSource, setPremoveSource] = useState<Square | null>(null);

  const playerColor = orientation || 'w';
  const isMyTurn = turn === playerColor;

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

  // Calculate pseudo-legal candidate moves for a pre-move
  const getPseudoLegalMovesForPremove = (currentFen: string, pColor: PieceColor, square: Square): string[] => {
    try {
      const parts = currentFen.split(' ');
      parts[1] = pColor;
      const simChess = new Chess(parts.join(' '));
      return simChess.moves({ square, verbose: true }).map((m) => m.to);
    } catch {
      return [];
    }
  };

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
  }, [fen, turn, playerColor, disabled]);

  const handleSquareClick = (square: Square) => {
    if (disabled) return;

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
      // OPPONENT TURN -> PRE-MOVE LOGIC
      if (premove) {
        setPremove(null);
      }

      const clickedPiece = chess.get(square);

      if (premoveSource) {
        if (premoveSource === square) {
          setPremoveSource(null);
          setLegalMoves([]);
          return;
        }

        if (clickedPiece && clickedPiece.color === playerColor) {
          setPremoveSource(square);
          const pseudoMoves = getPseudoLegalMovesForPremove(fen, playerColor, square);
          setLegalMoves(pseudoMoves);
          return;
        }

        setPremove({ from: premoveSource, to: square });
        setPremoveSource(null);
        setLegalMoves([]);
      } else {
        if (clickedPiece && clickedPiece.color === playerColor) {
          setPremoveSource(square);
          const pseudoMoves = getPseudoLegalMovesForPremove(fen, playerColor, square);
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
    if (disabled) return;
    const piece = chess.get(square);
    if (!piece) return;

    if (isMyTurn) {
      if (piece.color !== turn) return;
      setDraggedSquare(square);
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true }).map((m) => m.to);
      setLegalMoves(moves);
    } else {
      if (piece.color !== playerColor) return;
      setDraggedSquare(square);
      setPremoveSource(square);
      const pseudoMoves = getPseudoLegalMovesForPremove(fen, playerColor, square);
      setLegalMoves(pseudoMoves);
    }

    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, square: Square) => {
    if (disabled) return;
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
    if (disabled) return;
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
      if (piece && piece.color === playerColor) {
        setPremove({ from: fromSquare, to: targetSquare });
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

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setPremove(null);
        setPremoveSource(null);
        setSelectedSquare(null);
        setLegalMoves([]);
      }}
      className="relative select-none w-full max-w-[560px] aspect-square mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-900"
    >
      {/* Floating Pre-move Banner */}
      {premove && (
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
            const isDraggable = !disabled && (isMyTurn ? piece?.color === turn : piece?.color === playerColor);

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onDragOver={(e) => handleDragOver(e, square)}
                onDragLeave={(e) => handleDragLeave(e, square)}
                onDrop={(e) => handleDrop(e, square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                  isLight ? 'bg-amber-100' : 'bg-emerald-800'
                } ${
                  isSelected
                    ? isMyTurn
                      ? 'bg-amber-300 ring-4 ring-amber-500 z-10 shadow-md'
                      : 'bg-purple-400/80 ring-4 ring-purple-500 z-10 shadow-md'
                    : ''
                } ${
                  isPremoveFrom
                    ? 'bg-purple-600/70 border-2 border-dashed border-purple-300 ring-2 ring-purple-400 z-10'
                    : isPremoveTo
                    ? 'bg-purple-500/80 ring-4 ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.7)] z-10'
                    : ''
                } ${
                  isDragOver && isLegal
                    ? isMyTurn
                      ? 'ring-4 ring-emerald-400 bg-emerald-400/40 z-20 scale-[1.02] shadow-xl'
                      : 'ring-4 ring-purple-400 bg-purple-400/40 z-20 scale-[1.02] shadow-xl'
                    : ''
                } ${
                  isLastMoveFrom
                    ? 'bg-amber-300/70 border-2 border-dashed border-amber-500/60'
                    : isLastMoveTo
                    ? 'bg-amber-400/80 ring-2 ring-amber-500/70 shadow-[inset_0_0_10px_rgba(245,158,11,0.5)] z-1'
                    : ''
                } ${isKingCheck ? 'bg-rose-600/90 ring-4 ring-rose-500 z-10 animate-pulse' : ''}`}
              >
                {/* File / Rank Labels */}
                {fIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] font-bold z-10 ${
                      isLight ? 'text-emerald-900' : 'text-amber-100'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-bold z-10 ${
                      isLight ? 'text-emerald-900' : 'text-amber-100'
                    }`}
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
  );
};
