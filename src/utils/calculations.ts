import type { Work, WorkCalculation } from '../types';
import { TODAY } from '../constants';
import { addDays } from './dateUtils';

export function calculateWork(work: Work): WorkCalculation {
  const { totalVol, doneVol, mode, weeksWorked, manualRate, brigades, plannedStartDate } = work;

  const remaining = Math.max(0, totalVol - doneVol);
  const ratePerWeek =
    mode === 'history'
      ? weeksWorked > 0
        ? doneVol / weeksWorked
        : 0
      : manualRate * brigades;

  const weeksLeft = ratePerWeek > 0 ? remaining / ratePerWeek : null;

  let baseDate = TODAY;
  if (doneVol === 0 && plannedStartDate) {
    baseDate = new Date(plannedStartDate);
  }

  const endDate = weeksLeft !== null ? addDays(baseDate, Math.round(weeksLeft * 7)) : null;

  let startDate: Date;
  if (doneVol === 0 && plannedStartDate) {
    startDate = new Date(plannedStartDate);
  } else {
    startDate =
      mode === 'history' ? addDays(TODAY, -Math.round(weeksWorked * 7)) : new Date(TODAY);
  }

  const progress = totalVol > 0 ? Math.min(100, (doneVol / totalVol) * 100) : 0;
  const totalWeeks =
    weeksLeft !== null ? (mode === 'history' ? weeksWorked : 0) + weeksLeft : null;

  return { remaining, ratePerWeek, weeksLeft, endDate, startDate, progress, totalWeeks };
}
