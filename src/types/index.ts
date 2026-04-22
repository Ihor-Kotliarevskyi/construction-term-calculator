export type Unit = 'м³' | 'м²' | 'т' | 'шт';
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
  objectName: string;
  works: Work[];
}
