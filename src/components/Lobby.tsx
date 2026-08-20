import React, { useState, useEffect } from 'react';
import { UserProfile, TimeControl, GameRoom, BoardThemeId } from '../types';
import { BoardThemePicker } from './BoardThemePicker';
import { Swords, Bot, Users, Key, Zap, Clock, ShieldCheck, Loader2, Eye, Radio, RefreshCw } from 'lucide-react';

interface LobbyProps {
  user: UserProfile | null;
  currentTheme: BoardThemeId;
  onSelectTheme: (theme: BoardThemeId) => void;
  onJoinQueue: (tc: TimeControl, isRated: boolean) => void;
  onLeaveQueue: () => void;
  onCreateRoom: (mode: 'pvp_online' | 'pvp_local' | 'ai', tc: TimeControl, aiDifficulty?: 'easy' | 'medium' | 'hard', isRated?: boolean) => void;
  onJoinRoomCode: (code: string) => void;
  onSpectateRoom: (roomId: string) => void;
  inQueue: boolean;
  queueStatus?: { position: number; totalInQueue: number } | null;
  onOpenAuth: () => void;
}

const PRESET_TIME_CONTROLS: TimeControl[] = [
  { initialMinutes: 1, incrementSeconds: 0, name: '1m Bullet' },
  { initialMinutes: 3, incrementSeconds: 0, name: '3m Blitz' },
  { initialMinutes: 5, incrementSeconds: 3, name: '5+3 Blitz' },
  { initialMinutes: 10, incrementSeconds: 0, name: '10m Rapid' },
  { initialMinutes: 15, incrementSeconds: 10, name: '15+10 Rapid' },
];

export const Lobby: React.FC<LobbyProps> = ({
  user,
  currentTheme,
  onSelectTheme,
  onJoinQueue,
  onLeaveQueue,
  onCreateRoom,
  onJoinRoomCode,
  onSpectateRoom,
  inQueue,
  queueStatus,
  onOpenAuth,
}) => {
  const [selectedTC, setSelectedTC] = useState<TimeControl>(PRESET_TIME_CONTROLS[2]); // Default 5+3 Blitz
  const [selectedMode, setSelectedMode] = useState<'quick' | 'ai' | 'local' | 'code'>('quick');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isRated, setIsRated] = useState(true);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [liveGames, setLiveGames] = useState<GameRoom[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);

  useEffect(() => {
    fetchLiveGames();
    const interval = setInterval(fetchLiveGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveGames = async () => {
    try {
      setLoadingLive(true);
      const res = await fetch('/api/live-games');
      const data = await res.json();
      setLiveGames(data.games || []);
    } catch (err) {
      console.error('Error fetching live games:', err);
    } finally {
      setLoadingLive(false);
    }
  };

  const handleStart = () => {
    if (selectedMode === 'quick') {
      if (!user) {
        onOpenAuth();
        return;
      }
      onJoinQueue(selectedTC, isRated);
    } else if (selectedMode === 'ai') {
      onCreateRoom('ai', selectedTC, aiDifficulty, false);
    } else if (selectedMode === 'local') {
      onCreateRoom('pvp_local', selectedTC, undefined, false);
    } else if (selectedMode === 'code') {
      if (roomCodeInput.trim().length === 6) {
        onJoinRoomCode(roomCodeInput.trim());
      } else {
        onCreateRoom('pvp_online', selectedTC, undefined, isRated);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Elo Rated Online Chess</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mb-2">
            Play 2-Player Chess Live
          </h1>
          <p className="text-sm text-slate-300">
            Compete online in rated 1v1 matches, climb the global Elo leaderboard, practice against AI bots, or challenge a friend in real time.
          </p>
        </div>
      </div>

      {/* Main Mode Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            id: 'quick',
            title: 'Quick Match',
            desc: 'Find live online opponent',
            icon: Swords,
            color: 'from-amber-500 to-amber-600',
          },
          {
            id: 'ai',
            title: 'Play vs AI Bot',
            desc: 'Practice with Grandmaster bot',
            icon: Bot,
            color: 'from-purple-500 to-purple-600',
          },
          {
            id: 'local',
            title: 'Pass & Play',
            desc: '2 Players on same screen',
            icon: Users,
            color: 'from-blue-500 to-blue-600',
          },
          {
            id: 'code',
            title: 'Private Room',
            desc: 'Create or join via Room Code',
            icon: Key,
            color: 'from-emerald-500 to-emerald-600',
          },
        ].map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id as any)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${mode.color} flex items-center justify-center mb-3 shadow-md`}
              >
                <Icon className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">{mode.title}</h3>
              <p className="text-xs text-slate-400">{mode.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Options Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        {/* Time Control Selector */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Select Time Control</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {PRESET_TIME_CONTROLS.map((tc) => {
              const isSelected = selectedTC.name === tc.name;
              return (
                <button
                  key={tc.name}
                  onClick={() => setSelectedTC(tc)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/60'
                  }`}
                >
                  <div className="text-sm font-bold">{tc.name}</div>
                  <div className="text-[10px] opacity-80 font-medium">
                    {tc.initialMinutes}m + {tc.incrementSeconds}s
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Difficulty Selector if Mode is AI */}
        {selectedMode === 'ai' && (
          <div className="pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-purple-400" />
              <span>AI Opponent Level</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'easy', label: 'Beginner (1100 Elo)' },
                { id: 'medium', label: 'Master (1550 Elo)' },
                { id: 'hard', label: 'Grandmaster (2100 Elo)' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setAiDifficulty(diff.id as any)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    aiDifficulty === diff.id
                      ? 'bg-purple-600 text-slate-100 border-purple-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Room Code Input if Mode is Private Code */}
        {selectedMode === 'code' && (
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Join Game with Room Code</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit Code (e.g. 849201)"
                maxLength={6}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-xs text-slate-400 italic">
              Or leave blank and click Create Room below to get a shareable code!
            </p>
          </div>
        )}

        {/* Rated Match Toggle */}
        {(selectedMode === 'quick' || selectedMode === 'code') && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-slate-200">Elo Rated Game</span>
                <p className="text-[11px] text-slate-400">Wins increase Elo rating; losses decrease it.</p>
              </div>
            </div>
            <button
              onClick={() => setIsRated(!isRated)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                isRated ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  isRated ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Board Theme Customization */}
        <div className="pt-3 border-t border-slate-800">
          <BoardThemePicker
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
            variant="panel"
          />
        </div>

        {/* Queue / Action Launch Button */}
        <div className="pt-4 border-t border-slate-800">
          {inQueue ? (
            <div className="bg-slate-800 border border-amber-500/40 rounded-2xl p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Searching for Opponent...</span>
              </div>
              {queueStatus && (
                <p className="text-xs text-slate-400">
                  Players in Queue: {queueStatus.totalInQueue}
                </p>
              )}
              <button
                onClick={onLeaveQueue}
                className="px-6 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold text-xs transition-colors"
              >
                Cancel Queue
              </button>
            </div>
          ) : (
            <button
              onClick={handleStart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              <span>
                {selectedMode === 'quick'
                  ? 'Find Match'
                  : selectedMode === 'ai'
                  ? 'Start AI Game'
                  : selectedMode === 'local'
                  ? 'Start Local Game'
                  : roomCodeInput.trim()
                  ? 'Join Game Room'
                  : 'Create Game Room'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Live Spectate Games Section */}
      <div className="bg-[#16191f] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Live Ongoing Games</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
              {liveGames.length} Active
            </span>
          </div>

          <button
            onClick={fetchLiveGames}
            disabled={loadingLive}
            title="Refresh Live Games List"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {liveGames.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-[#1c2128] border border-slate-800/80 rounded-2xl space-y-1">
            <p className="font-bold text-slate-200">No active matches currently in progress</p>
            <p className="text-[11px] text-slate-500">Start a Quick Match or AI game above to populate the directory!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveGames.map((game) => (
              <div
                key={game.id}
                className="bg-[#1c2128] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      {game.timeControl.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>{game.spectatorsCount || 0} Spectators</span>
                    </span>
                  </div>

                  {/* Players */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span className="truncate">⚪ {game.whitePlayer.username}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{game.whitePlayer.elo} Elo</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span className="truncate">
                        ⚫ {game.blackPlayer ? game.blackPlayer.username : 'Waiting...'}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {game.blackPlayer ? `${game.blackPlayer.elo} Elo` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>{game.history.length} moves played</span>
                  <button
                    onClick={() => onSpectateRoom(game.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Spectate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
