import React, { useState, useEffect } from 'react';
import { MatchHistoryItem, UserProfile } from '../types';
import { GameAnalysisModal } from './GameAnalysisModal';
import { History, Trophy, ArrowUpRight, ArrowDownRight, Minus, Eye, Activity } from 'lucide-react';

interface MatchHistoryProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ user, onOpenAuth }) => {
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchHistoryItem | null>(null);
  const [analysisMatch, setAnalysisMatch] = useState<MatchHistoryItem | null>(null);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/match-history/${user.id}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching match history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <History className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-100">Log In to View Match History</h2>
        <p className="text-xs text-slate-400">
          Track your past chess games, Elo rating gains and losses, and review move records.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20"
        >
          Log In or Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <History className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">Your Match History</h1>
            <p className="text-xs text-slate-400">Past games played by {user.username}</p>
          </div>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
            Loading game history...
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <p className="font-bold text-slate-200">No games recorded yet</p>
            <p className="text-xs">Play a quick match or online game to start building your record!</p>
          </div>
        ) : (
          history.map((match) => {
            const isWhite = match.whitePlayerName === user.username;
            const myScore =
              match.result === 'draw'
                ? 'draw'
                : (isWhite && match.result === 'white_won') || (!isWhite && match.result === 'black_won')
                ? 'win'
                : 'loss';

            const myEloDelta = isWhite ? match.eloChangeWhite : match.eloChangeBlack;

            return (
              <div
                key={match.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                {/* Result Indicator Badge & Details */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl font-black text-xs flex flex-col items-center justify-center border uppercase tracking-wider shrink-0 ${
                      myScore === 'win'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : myScore === 'loss'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>{myScore}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-100 text-sm sm:text-base">
                      <span>{match.whitePlayerName}</span>
                      <span className="text-slate-500 text-xs">vs</span>
                      <span>{match.blackPlayerName}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{match.timeControlName}</span>
                      <span>•</span>
                      <span>{match.totalMoves} moves</span>
                      <span>•</span>
                      <span>{match.reason}</span>
                    </div>
                  </div>
                </div>

                {/* Elo Delta & Replay */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Elo Rating Change</div>
                    <div
                      className={`font-mono font-black text-sm flex items-center gap-1 justify-end ${
                        myEloDelta > 0
                          ? 'text-emerald-400'
                          : myEloDelta < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {myEloDelta > 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : myEloDelta < 0 ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                      <span>
                        {myEloDelta > 0 ? `+${myEloDelta}` : myEloDelta} Elo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAnalysisMatch(match)}
                      className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                    >
                      <Activity className="w-4 h-4" />
                      <span>Analyze</span>
                    </button>

                    <button
                      onClick={() => setSelectedMatch(selectedMatch?.id === match.id ? null : match)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>PGN</span>
                    </button>
                  </div>
                </div>

                {/* Expanded PGN Box */}
                {selectedMatch?.id === match.id && (
                  <div className="w-full sm:col-span-2 pt-3 border-t border-slate-800 bg-slate-950/60 p-3 rounded-xl font-mono text-xs text-amber-300 break-words leading-relaxed">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold mb-1">
                      PGN Move Record
                    </span>
                    {match.pgn || 'No moves recorded.'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Game Analysis Modal */}
      {analysisMatch && (
        <GameAnalysisModal
          match={analysisMatch}
          onClose={() => setAnalysisMatch(null)}
        />
      )}
    </div>
  );
};
