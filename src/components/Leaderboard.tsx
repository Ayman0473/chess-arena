import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal, Search, Flame, Shield, RefreshCw } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setEntries(data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredEntries = entries.filter((e) =>
    e.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: '🥇' };
    if (rank === 2) return { color: 'text-slate-300 bg-slate-300/10 border-slate-300/30', icon: '🥈' };
    if (rank === 3) return { color: 'text-amber-700 bg-amber-700/10 border-amber-700/30', icon: '🥉' };
    return { color: 'text-slate-400 bg-slate-800 border-slate-700', icon: `#${rank}` };
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">Global Elo Rankings</h1>
            <p className="text-xs text-slate-400">Top ranked chess players sorted by Elo rating</p>
          </div>
        </div>

        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search player by username..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-md"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading rankings...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No players found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4 text-center">Elo Rating</th>
                  <th className="py-3 px-4 text-center">Win / Loss / Draw</th>
                  <th className="py-3 px-4 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium">
                {filteredEntries.map((entry) => {
                  const badge = getRankBadge(entry.rank);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs border ${badge.color}`}
                        >
                          {badge.icon}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={entry.avatarUrl}
                            alt={entry.username}
                            className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-slate-200">{entry.username}</span>
                            {entry.isGuest && (
                              <span className="ml-2 text-[10px] font-semibold text-slate-500 uppercase">
                                Guest
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{entry.elo}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        <span className="text-emerald-400 font-bold">{entry.wins}W</span> /{' '}
                        <span className="text-rose-400 font-bold">{entry.losses}L</span> /{' '}
                        <span className="text-slate-400 font-bold">{entry.draws}D</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-200">
                        {entry.winRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
