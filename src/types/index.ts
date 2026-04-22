export type Unit = 'м³' | 'м²' | 'т' | 'шт' | 'м' | 'комплект' | 'грн' | '%';
export type WorkMode = 'history' | 'manual';
export type ThemeName = 'light' | 'dark';

export interface Work {
  id: number;
  workName: string;
  unit: Unit;
  totalVol: number;
  doneVol: number;
  mode: WorkMode;
  weeksWorked: number;
  manualRate: number;
  brigades: number;
  plannedStartDate: string;
  contractor: string;
}

export interface Project {
  id: number;
  name: string;
  works: Work[];
}

export interface WorkCalculation {
  remaining: number;
  ratePerWeek: number;
  weeksLeft: number | null;
  endDate: Date | null;
  startDate: Date;
  progress: number;
  totalWeeks: number | null;
}

export interface ProjectData {
  name: string;
  works: Work[];
}
