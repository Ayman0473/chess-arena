import { Chess, Square, Move } from 'chess.js';

// Piece values for material evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900,
};

// Simple positional value multipliers
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

export function calculateEloDelta(
  ratingA: number,
  ratingB: number,
  scoreA: number, // 1 for win, 0.5 for draw, 0 for loss
  kFactor: number = 32
): { deltaA: number; deltaB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const scoreB = 1 - scoreA;

  const deltaA = Math.round(kFactor * (scoreA - expectedA));
  const deltaB = Math.round(kFactor * (scoreB - expectedB));

  return { deltaA, deltaB };
}

export function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        let val = PIECE_VALUES[piece.type] || 0;
        const idx = r * 8 + c;

        if (piece.type === 'p') val += PAWN_TABLE[piece.color === 'w' ? idx : 63 - idx];
        else if (piece.type === 'n') val += KNIGHT_TABLE[piece.color === 'w' ? idx : 63 - idx];

        if (piece.color === 'w') {
          score += val;
        } else {
          score -= val;
        }
      }
    }
  }

  return score;
}

export function getAIMove(
  fen: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Move | null {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });

    if (moves.length === 0) return null;

    // Easy AI: 80% random move, 20% simple capture
    if (difficulty === 'easy') {
      const captures = moves.filter((m) => m.captured);
      if (captures.length > 0 && Math.random() < 0.3) {
        return captures[Math.floor(Math.random() * captures.length)];
      }
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const isBotWhite = chess.turn() === 'w';

    // Medium AI: Minimax depth 2 with material evaluation
    if (difficulty === 'medium') {
      let bestMove: Move | null = null;
      let bestScore = isBotWhite ? -Infinity : Infinity;

      for (const move of moves) {
        chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
        const val = evaluateBoard(chess);
        chess.undo();

        if (isBotWhite) {
          if (val > bestScore) {
            bestScore = val;
            bestMove = move;
          }
        } else {
          if (val < bestScore) {
            bestScore = val;
            bestMove = move;
          }
        }
      }
      return bestMove || moves[Math.floor(Math.random() * moves.length)];
    }

    // Hard AI: Minimax depth 3 with Alpha-Beta pruning
    return minimaxRoot(chess, 3, isBotWhite) || moves[Math.floor(Math.random() * moves.length)];
  } catch (err) {
    console.error('Error generating AI move:', err);
    try {
      const fallbackChess = new Chess(fen);
      const fallbackMoves = fallbackChess.moves({ verbose: true });
      return fallbackMoves.length > 0 ? fallbackMoves[0] : null;
    } catch {
      return null;
    }
  }
}

function minimaxRoot(chess: Chess, depth: number, isMaximizing: boolean): Move | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  let bestMove: Move | null = null;
  let bestValue = isMaximizing ? -Infinity : Infinity;

  // Sort captures first for better pruning
  moves.sort((a, b) => (b.captured ? 10 : 0) - (a.captured ? 10 : 0));

  for (const move of moves) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
    const value = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing);
    chess.undo();

    if (isMaximizing) {
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    } else {
      if (value < bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }
  }

  return bestMove;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const evalVal = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const evalVal = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getCapturedPieces(fen: string): { whiteCaptured: string[]; blackCaptured: string[] } {
  const chess = new Chess(fen);
  const board = chess.board();

  const initialCounts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const currentCountsWhite: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  const currentCountsBlack: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type !== 'k') {
        if (p.color === 'w') {
          currentCountsWhite[p.type] = (currentCountsWhite[p.type] || 0) + 1;
        } else {
          currentCountsBlack[p.type] = (currentCountsBlack[p.type] || 0) + 1;
        }
      }
    }
  }

  const whiteCaptured: string[] = []; // Black pieces captured by White
  const blackCaptured: string[] = []; // White pieces captured by Black

  Object.keys(initialCounts).forEach((type) => {
    const missingWhite = Math.max(0, initialCounts[type] - currentCountsWhite[type]);
    const missingBlack = Math.max(0, initialCounts[type] - currentCountsBlack[type]);

    for (let i = 0; i < missingWhite; i++) blackCaptured.push(type.toUpperCase());
    for (let i = 0; i < missingBlack; i++) whiteCaptured.push(type);
  });

  return { whiteCaptured, blackCaptured };
}

export function getMaterialDifference(fen: string): { whiteDiff: number; blackDiff: number } {
  const { whiteCaptured, blackCaptured } = getCapturedPieces(fen);

  const val = (p: string) => PIECE_VALUES[p.toLowerCase()] || 0;

  const whitePoints = whiteCaptured.reduce((sum, p) => sum + val(p), 0);
  const blackPoints = blackCaptured.reduce((sum, p) => sum + val(p), 0);

  const diff = whitePoints - blackPoints;
  return {
    whiteDiff: diff > 0 ? diff / 10 : 0,
    blackDiff: diff < 0 ? Math.abs(diff) / 10 : 0,
  };
}
