import React, { useState, useEffect } from 'react';
import { MatchHistoryItem, MoveRecord } from '../types';
import { ChessBoard } from './ChessBoard';
import { getCapturedPieces, getMaterialDifference } from '../lib/chessEngine';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  BarChart2,
  Sparkles,
  Trophy,
  Activity,
  Layers,
} from 'lucide-react';

interface GameAnalysisModalProps {
  match: MatchHistoryItem | null;
  onClose: () => void;
}

export const GameAnalysisModal: React.FC<GameAnalysisModalProps> = ({ match, onClose }) => {
  if (!match) return null;

  // Move index: -1 means initial board position, 0..N-1 means board after move N
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const history: MoveRecord[] = match.history || [];
  const totalSteps = history.length;

  const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const currentFen = currentStep >= 0 && currentStep < totalSteps ? history[currentStep].fen : startingFen;
  const currentMove = currentStep >= 0 && currentStep < totalSteps ? history[currentStep] : null;

  // Auto-play timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSteps]);

  const { whiteCaptured, blackCaptured } = getCapturedPieces(currentFen);
  const { whiteDiff, blackDiff } = getMaterialDifference(currentFen);

  // Group moves into pairs (White move + Black move)
  const movePairs: { moveNumber: number; white?: MoveRecord; black?: MoveRecord; whiteIdx?: number; blackIdx?: number }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIdx: i,
      black: history[i + 1],
      blackIdx: i + 1 < history.length ? i + 1 : undefined,
    });
  }

  // Generate tactical annotation for current move
  const getMoveAnnotation = () => {
    if (!currentMove) return 'Initial Position - Starting Setup';

    let text = `Move ${currentMove.moveNumber}: `;
    if (currentMove.color === 'w') text += `${match.whitePlayerName} plays ${currentMove.san}`;
    else text += `${match.blackPlayerName} plays ${currentMove.san}`;

    if (currentMove.san.includes('#')) text += ' (Checkmate!)';
    else if (currentMove.san.includes('+')) text += ' (Check!)';
    else if (currentMove.captured) text += ` (Captured ${currentMove.captured.toUpperCase()})`;

    return text;
  };

  return (
    <div className="fixed inset-0 bg-[#0f1115]/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#16191f] border border-slate-800 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-6 relative flex flex-col my-auto max-h-[92vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Interactive Game Analysis</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  {match.timeControlName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {match.whitePlayerName} ({match.whiteElo}) vs {match.blackPlayerName} ({match.blackElo}) •{' '}
                {match.reason}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Column: Chess Board & Replay Controls */}
          <div className="lg:col-span-7 space-y-4 flex flex-col items-center">
            {/* Board */}
            <div className="w-full max-w-[480px]">
              <ChessBoard
                fen={currentFen}
                onMove={() => {}}
                turn={currentMove ? (currentMove.color === 'w' ? 'b' : 'w') : 'w'}
                disabled={true}
                lastMove={currentMove ? { from: currentMove.from, to: currentMove.to } : null}
              />
            </div>

            {/* Replay Step Controls */}
            <div className="w-full max-w-[480px] bg-[#1c2128] border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(-1);
                  }}
                  disabled={currentStep === -1}
                  title="First Move"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep((p) => Math.max(-1, p - 1));
                  }}
                  disabled={currentStep === -1}
                  title="Previous Move"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Play / Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep((p) => Math.min(totalSteps - 1, p + 1));
                  }}
                  disabled={currentStep >= totalSteps - 1}
                  title="Next Move"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(totalSteps - 1);
                  }}
                  disabled={currentStep >= totalSteps - 1}
                  title="Last Move"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Move Annotation Banner */}
            <div className="w-full max-w-[480px] p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="truncate">{getMoveAnnotation()}</span>
            </div>
          </div>

          {/* Right Column: Move Notation List & Material Analytics */}
          <div className="lg:col-span-5 space-y-4">
            {/* Material & Evaluation Panel */}
            <div className="bg-[#1c2128] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>Material Balance</span>
                </span>
                <span className="font-mono text-emerald-400">
                  {whiteDiff > 0 ? `White +${whiteDiff}` : blackDiff > 0 ? `Black +${blackDiff}` : 'Equal'}
                </span>
              </div>

              {/* Captured Pieces Display */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">White Captures</span>
                  <div className="flex flex-wrap gap-1 min-h-[20px]">
                    {whiteCaptured.length > 0 ? (
                      whiteCaptured.map((p, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] font-bold">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-600">None</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Black Captures</span>
                  <div className="flex flex-wrap gap-1 min-h-[20px]">
                    {blackCaptured.length > 0 ? (
                      blackCaptured.map((p, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] font-bold">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-600">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Move Table */}
            <div className="bg-[#1c2128] border border-slate-800 rounded-2xl p-4 flex flex-col h-[340px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Move History ({totalSteps} plies)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Click move to jump</span>
              </div>

              <div className="flex-1 overflow-y-auto mt-2 space-y-1 pr-1 font-mono text-xs">
                {movePairs.map((pair) => (
                  <div key={pair.moveNumber} className="grid grid-cols-12 items-center py-1.5 px-2 rounded-xl hover:bg-slate-800/60">
                    <span className="col-span-2 text-slate-500 text-[11px]">{pair.moveNumber}.</span>

                    {/* White move */}
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        if (pair.whiteIdx !== undefined) setCurrentStep(pair.whiteIdx);
                      }}
                      className={`col-span-5 text-left px-2 py-1 rounded-lg transition-colors font-bold ${
                        currentStep === pair.whiteIdx
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {pair.white?.san}
                    </button>

                    {/* Black move */}
                    {pair.black ? (
                      <button
                        onClick={() => {
                          setIsPlaying(false);
                          if (pair.blackIdx !== undefined) setCurrentStep(pair.blackIdx);
                        }}
                        className={`col-span-5 text-left px-2 py-1 rounded-lg transition-colors font-bold ${
                          currentStep === pair.blackIdx
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {pair.black.san}
                      </button>
                    ) : (
                      <span className="col-span-5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
