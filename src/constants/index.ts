import type { Unit, ThemeName } from '../types';

export const TODAY = new Date(2026, 3, 22);

export const UNITS: Unit[] = ['м³', 'м²', 'т', 'шт'];

export const THEME_BG: Record<ThemeName, string> = {
  light: '#f3f4f6',
  dark: '#111110',
};
