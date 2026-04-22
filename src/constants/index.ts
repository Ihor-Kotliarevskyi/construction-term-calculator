import type { Unit, ThemeName } from '../types';

export const TODAY = new Date();

export const UNITS: Unit[] = ['м³', 'м²', 'т', 'шт', 'м', 'комплект', 'грн', '%'];

export const THEME_BG: Record<ThemeName, string> = {
  light: '#f3f4f6',
  dark: '#111110',
};
