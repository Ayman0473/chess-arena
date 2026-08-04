import React from 'react';
import { BookOpen, Shield, Trophy, Zap, Info } from 'lucide-react';

export const RuleGuideModal: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
          <BookOpen className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">Chess Rules & Elo Guide</h1>
          <p className="text-xs text-slate-400">Everything you need to know about playing 1v1 chess and climbing ratings</p>
        </div>
      </div>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Elo Rating System */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Trophy className="w-5 h-5" />
            <h3>The Elo Rating System</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Elo system measures relative skill levels in two-player games. Every new registered user starts at <strong>1200 Elo</strong>.
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong>Win:</strong> Gain Elo points based on opponent rating difference.</li>
            <li><strong>Loss:</strong> Lose Elo points according to expected outcome formula.</li>
            <li><strong>Draw:</strong> Rating shifts slightly based on expected score difference.</li>
          </ul>
        </div>

        {/* Card 2: Special Moves */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Zap className="w-5 h-5" />
            <h3>Special Moves Supported</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The board engine fully enforces standard international FIDE chess rules:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong>Castling (O-O / O-O-O):</strong> King moves 2 squares towards Rook if no pieces obstruct and King is not in check.</li>
            <li><strong>En Passant:</strong> Capture enemy pawn immediately after it advances two squares.</li>
            <li><strong>Pawn Promotion:</strong> Choice of Queen, Rook, Bishop, or Knight upon reaching 8th rank.</li>
          </ul>
        </div>

        {/* Card 3: Game Termination */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Shield className="w-5 h-5" />
            <h3>Winning & Draw Conditions</h3>
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong>Checkmate:</strong> King is in check with no legal escape moves available.</li>
            <li><strong>Stalemate:</strong> Active player has no legal moves while NOT in check (Draw).</li>
            <li><strong>Time Out:</strong> Player's clock reaches 00:00.</li>
            <li><strong>Draw Agreement / 50-Move Rule:</strong> Both players agree or 50 moves pass without pawn move or capture.</li>
          </ul>
        </div>

        {/* Card 4: Ranking Tiers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Info className="w-5 h-5" />
            <h3>Ranking Badges</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Grandmaster (2000+)
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Master (1600 - 1999)
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Expert (1400 - 1599)
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Intermediate (1200 - 1399)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
