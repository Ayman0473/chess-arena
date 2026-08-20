import React from 'react';
import { BoardThemeId } from '../types';
import { BOARD_THEMES } from '../lib/themes';
import { Palette, Check } from 'lucide-react';

interface BoardThemePickerProps {
  currentTheme: BoardThemeId;
  onSelectTheme: (theme: BoardThemeId) => void;
  variant?: 'panel' | 'compact' | 'dropdown';
  className?: string;
}

export const BoardThemePicker: React.FC<BoardThemePickerProps> = ({
  currentTheme,
  onSelectTheme,
  variant = 'panel',
  className = '',
}) => {
  const themes = Object.values(BOARD_THEMES);

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        {themes.map((t) => {
          const isSelected = currentTheme === t.id;
          return (
            <button
              key={t.id}
              id={`theme-btn-compact-${t.id}`}
              onClick={() => onSelectTheme(t.id)}
              title={`${t.name} (${t.tagline})`}
              className={`p-1.5 rounded-xl border transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/40 text-amber-300 font-bold shadow-md'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {/* Mini 2x2 board preview */}
              <div className="w-5 h-5 rounded overflow-hidden grid grid-cols-2 grid-rows-2 shadow-inner shrink-0 border border-black/20">
                <div style={{ backgroundColor: t.lightTile }} />
                <div style={{ backgroundColor: t.darkTile }} />
                <div style={{ backgroundColor: t.darkTile }} />
                <div style={{ backgroundColor: t.lightTile }} />
              </div>
              <span className="text-xs truncate max-w-[80px] sm:max-w-none">{t.name}</span>
              {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
          <Palette className="w-4 h-4 text-amber-400" />
          <span>Chessboard Theme</span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
          {BOARD_THEMES[currentTheme]?.name || 'Classic'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {themes.map((t) => {
          const isSelected = currentTheme === t.id;
          return (
            <button
              key={t.id}
              id={`theme-btn-panel-${t.id}`}
              onClick={() => onSelectTheme(t.id)}
              className={`group relative p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center gap-2 ${
                isSelected
                  ? 'bg-slate-800/95 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              {/* Miniature 3x3 Preview Grid */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden grid grid-cols-3 grid-rows-3 shadow-md border border-black/30 group-hover:scale-105 transition-transform">
                <div style={{ backgroundColor: t.lightTile }} />
                <div style={{ backgroundColor: t.darkTile }} />
                <div style={{ backgroundColor: t.lightTile }} />

                <div style={{ backgroundColor: t.darkTile }} />
                <div style={{ backgroundColor: t.lightTile }} />
                <div style={{ backgroundColor: t.darkTile }} />

                <div style={{ backgroundColor: t.lightTile }} />
                <div style={{ backgroundColor: t.darkTile }} />
                <div style={{ backgroundColor: t.lightTile }} />

                {isSelected && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                    <Check className="w-5 h-5 text-white drop-shadow-md stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Theme Details */}
              <div className="text-center w-full">
                <div
                  className={`text-xs font-bold truncate ${
                    isSelected ? 'text-amber-300' : 'text-slate-200 group-hover:text-white'
                  }`}
                >
                  {t.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
