import { BoardTheme, BoardThemeId } from '../types';

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic Wood',
    lightTile: '#f0d9b5',
    darkTile: '#b58863',
    lightLabel: '#b58863',
    darkLabel: '#f0d9b5',
    borderColor: '#784624',
    tagline: 'Warm walnut & maple cream',
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    lightTile: '#eeeed2',
    darkTile: '#769656',
    lightLabel: '#769656',
    darkLabel: '#eeeed2',
    borderColor: '#4d6c34',
    tagline: 'Standard tournament green & ivory',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    lightTile: '#dee3e6',
    darkTile: '#4e7399',
    lightLabel: '#4e7399',
    darkLabel: '#dee3e6',
    borderColor: '#2b4c6f',
    tagline: 'Cool maritime blue & arctic mist',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Slate',
    lightTile: '#94a3b8',
    darkTile: '#334155',
    lightLabel: '#1e293b',
    darkLabel: '#cbd5e1',
    borderColor: '#0f172a',
    tagline: 'Modern cyber slate & zinc',
  },
  coral: {
    id: 'coral',
    name: 'Coral Sunset',
    lightTile: '#f4dfd0',
    darkTile: '#c46845',
    lightLabel: '#c46845',
    darkLabel: '#f4dfd0',
    borderColor: '#8e3518',
    tagline: 'Warm terracotta & soft peach',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst Violet',
    lightTile: '#ede9fe',
    darkTile: '#7c3aed',
    lightLabel: '#7c3aed',
    darkLabel: '#ede9fe',
    borderColor: '#5b21b6',
    tagline: 'Regal lavender & royal purple',
  },
};

export const DEFAULT_BOARD_THEME: BoardThemeId = 'forest';

export function getStoredBoardTheme(): BoardThemeId {
  try {
    const saved = localStorage.getItem('chess_board_theme') as BoardThemeId;
    if (saved && BOARD_THEMES[saved]) {
      return saved;
    }
  } catch {}
  return DEFAULT_BOARD_THEME;
}

export function saveStoredBoardTheme(themeId: BoardThemeId): void {
  try {
    localStorage.setItem('chess_board_theme', themeId);
  } catch {}
}
