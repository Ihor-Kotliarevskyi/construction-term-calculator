import { useMemo } from 'react';
import type { Work, WorkCalculation } from '../../types';
import { TODAY } from '../../constants';
import { addDays, fmt, fmtMonth } from '../../utils/dateUtils';
import styles from './GanttChart.module.css';

interface GanttChartProps {
  works: Work[];
  calculations: Record<number, WorkCalculation>;
  activeWorkId: number | 'main';
  groupByContractor?: boolean;
}

export function GanttChart({ works, calculations, activeWorkId, groupByContractor = false }: GanttChartProps) {
  const { minDate, maxDate, hasValid } = useMemo(() => {
    let minDate = new Date(TODAY);
    let maxDate = addDays(TODAY, 90);
    let hasValid = false;

    works.forEach((w) => {
      const c = calculations[w.id];
      if (!c) return;
      if (!hasValid || c.startDate < minDate) {
        minDate = new Date(c.startDate);
      }
      hasValid = true;
      if (c.endDate && c.endDate > maxDate) {
        maxDate = new Date(c.endDate);
      }
    });

    return { minDate, maxDate, hasValid };
  }, [works, calculations]);

  const totalMs = maxDate.getTime() - minDate.getTime();

  const ticks = useMemo(() => {
    if (!hasValid || totalMs <= 0) return [];
    const result: { pct: number; label: string; isMonth: boolean }[] = [];
    const cur = new Date(minDate);
    cur.setDate(1);

    while (cur <= maxDate) {
      const pct1 = ((cur.getTime() - minDate.getTime()) / totalMs) * 100;
      if (pct1 >= 0 && pct1 <= 100) {
        result.push({ pct: pct1, label: fmtMonth(cur), isMonth: true });
      }
      const mid = new Date(cur);
      mid.setDate(15);
      const pct15 = ((mid.getTime() - minDate.getTime()) / totalMs) * 100;
      if (pct15 >= 0 && pct15 <= 100) {
        result.push({ pct: pct15, label: '15', isMonth: false });
      }
      cur.setMonth(cur.getMonth() + 1);
    }
    return result;
  }, [minDate, maxDate, totalMs, hasValid]);

  if (!hasValid) return <div className={styles.empty}>Недостатньо даних</div>;
  if (totalMs <= 0) return <div className={styles.empty}>Некоректний період</div>;

  const todayPct = ((TODAY.getTime() - minDate.getTime()) / totalMs) * 100;

  // Build flat list of rows: contractor separators + work rows
  const rows: React.ReactNode[] = [];
  let prevContractor: string | undefined = undefined;

  works.forEach((work) => {
    const c = calculations[work.id];
    if (!c || !c.endDate || c.startDate.getTime() >= c.endDate.getTime()) return;

    // Contractor group separator
    if (groupByContractor && work.contractor !== prevContractor) {
      prevContractor = work.contractor;
      if (work.contractor) {
        rows.push(
          <div key={`contractor-${work.contractor}`} className={styles.contractorGroup}>
            {work.contractor}
          </div>,
        );
      }
    }

    const startPct = ((c.startDate.getTime() - minDate.getTime()) / totalMs) * 100;
    const endPct = ((c.endDate.getTime() - minDate.getTime()) / totalMs) * 100;
    const widthPct = endPct - startPct;

    const workMs = c.endDate.getTime() - c.startDate.getTime();
    const todayInWork =
      workMs > 0
        ? Math.min(100, Math.max(0, ((TODAY.getTime() - c.startDate.getTime()) / workMs) * 100))
        : 0;

    const isActive = activeWorkId === work.id;
    const isDimmed = activeWorkId !== 'main' && !isActive;

    rows.push(
      <div key={work.id} className={`${styles.workRow} ${isDimmed ? styles.workRowDimmed : ''}`}>
        <div className={styles.workLabel}>
          <span className={`${styles.workName} ${isActive ? styles.workNameActive : ''}`}>
            {work.workName}{' '}
            <span className={styles.workVol}>
              ({work.totalVol} {work.unit})
            </span>
          </span>
          <span className={styles.workDates}>
            {fmt(c.startDate)} – {fmt(c.endDate)}
          </span>
        </div>
        <div className={styles.barTrack}>
          <div
            className={`${styles.bar} ${isActive ? styles.barActive : ''}`}
            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
          >
            {work.doneVol > 0 && (
              <div className={styles.barDone} style={{ width: `${todayInWork}%` }} />
            )}
          </div>
        </div>
      </div>,
    );
  });

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        {ticks.map((t, i) => (
          <div
            key={i}
            className={`${styles.tick} ${t.isMonth ? styles.tickMonth : ''}`}
            style={{ left: `${t.pct}%` }}
          >
            {t.label}
          </div>
        ))}
        {todayPct >= 0 && todayPct <= 100 && (
          <div className={styles.todayHeaderMark} style={{ left: `${todayPct}%` }} />
        )}
      </div>

      <div className={styles.body}>
        {ticks.map((t, i) => (
          <div
            key={`g${i}`}
            className={t.isMonth ? styles.gridLine : styles.gridLineSub}
            style={{ left: `${t.pct}%` }}
          />
        ))}
        {todayPct >= 0 && todayPct <= 100 && (
          <div className={styles.todayLine} style={{ left: `${todayPct}%` }} />
        )}

        <div className={styles.rows}>{rows}</div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.swatch} ${styles.swatchDone}`} />
          Виконано
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.swatch} ${styles.swatchPlan}`} />
          Залишок / План
        </div>
        <div className={styles.legendItem}>
          <div className={styles.swatchToday} />
          Сьогодні ({fmt(TODAY)})
        </div>
      </div>
    </div>
  );
}
