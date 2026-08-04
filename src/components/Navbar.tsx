import React from 'react';
import { UserProfile } from '../types';
import { Trophy, Volume2, VolumeX, User, LogOut, Swords, History, BookOpen, Shield, Flame } from 'lucide-react';
import { sounds } from '../lib/audio';

interface NavbarProps {
  user: UserProfile | null;
  activeTab: 'play' | 'leaderboard' | 'history' | 'guide';
  setActiveTab: (tab: 'play' | 'leaderboard' | 'history' | 'guide') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  isMuted,
  setIsMuted,
}) => {
  const toggleAudio = () => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.setMuted(next);
  };

  const getRankBadge = (elo: number) => {
    if (elo >= 2000) return { title: 'Grandmaster', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    if (elo >= 1600) return { title: 'Master', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' };
    if (elo >= 1400) return { title: 'Expert', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };
    if (elo >= 1200) return { title: 'Intermediate', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    return { title: 'Novice', color: 'bg-slate-500/20 text-slate-400 border-slate-500/40' };
  };

  const badge = user ? getRankBadge(user.elo) : null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => setActiveTab('play')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Swords className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-100 tracking-tight">CHESS</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                ELO 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">Online 2-Player Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('play')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'play'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Play</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Match History</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'guide'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">Rules</span>
          </button>
        </nav>

        {/* Right Controls / Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mute Toggle */}
          <button
            onClick={toggleAudio}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-slate-300" />}
          </button>

          {/* User Profile / Login */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"
                />
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200">{user.username}</span>
                    {badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badge.color}`}>
                        {badge.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                    <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{user.elo} Elo</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span>Log In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
