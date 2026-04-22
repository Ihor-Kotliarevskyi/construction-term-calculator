import { useMemo } from 'react';
import { useAppStore, useActiveProject } from '../../store/useAppStore';
import { calculateWork } from '../../utils/calculations';
import { fmt } from '../../utils/dateUtils';
import { StatCard } from '../ui/StatCard';
import { GanttChart } from '../GanttChart/GanttChart';
import styles from './MainObjectTab.module.css';

export function MainObjectTab() {
  const { activeProjectId, activeWorkId, renameProject } = useAppStore();
  const activeProject = useActiveProject();
  const works = activeProject?.works ?? [];

  // Sort works: no contractor first, then alphabetically by contractor
  const sortedWorks = useMemo(
    () =>
      [...works].sort((a, b) => {
        if (!a.contractor && !b.contractor) return 0;
        if (!a.contractor) return -1;
        if (!b.contractor) return 1;
        return a.contractor.localeCompare(b.contractor, 'uk');
      }),
    [works],
  );

  const calculations = useMemo(() => {
    const map: Record<number, ReturnType<typeof calculateWork>> = {};
    works.forEach((w) => {
      map[w.id] = calculateWork(w);
    });
    return map;
  }, [works]);

  let maxDate: Date | null = null;
  let totalDurationMs = 0;
  let doneDurationMs = 0;

  works.forEach((w) => {
    const c = calculations[w.id];
    if (c.endDate) {
      if (!maxDate || c.endDate > maxDate) maxDate = new Date(c.endDate);
    }
    if (c.startDate && c.endDate) {
      const duration = c.endDate.getTime() - c.startDate.getTime();
      totalDurationMs += duration;
      doneDurationMs += duration * (c.progress / 100);
    }
  });

  const overallProgress = totalDurationMs > 0 ? (doneDurationMs / totalDurationMs) * 100 : 0;
  const progressColorClass =
    overallProgress < 30
      ? styles.colorRed
      : overallProgress < 65
        ? styles.colorAccent
        : styles.colorGood;
  const fillClass =
    overallProgress < 30
      ? styles.fillRed
      : overallProgress < 65
        ? styles.fillAccent
        : styles.fillGood;

  const projectName = activeProject?.name ?? '';
  const hasContractors = works.some((w) => w.contractor);

  return (
    <div id="main-print-area" className={styles.root}>
      <div className={styles.statsGrid}>
        <div className={styles.progressCard} style={{ padding: '6px 14px' }}>
          <div className={styles.finishLabel} style={{ textAlign: 'left', marginBottom: 2 }}>Об&apos;єкт</div>
          <input
            className={styles.objectNameInput}
            value={projectName}
            onChange={(e) => renameProject(activeProjectId, e.target.value)}
            placeholder="Назва..."
          />
        </div>

        <StatCard label="Всього робіт" value={works.length} small />

        <div className={styles.finishCard}>
          <div className={styles.finishLabel}>🏗 Фініш об&apos;єкта</div>
          <div className={styles.finishDate}>{maxDate ? fmt(maxDate) : '—'}</div>
        </div>

        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Загальна готовність</span>
            <span className={`${styles.progressPct} ${progressColorClass}`}>
              {overallProgress.toFixed(1)}%
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${fillClass}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className={styles.ganttPanel}>
        <div className={styles.ganttTitle}>Загальний графік виконання</div>
        <GanttChart
          works={sortedWorks}
          calculations={calculations}
          activeWorkId={activeWorkId}
          groupByContractor={hasContractors}
        />
      </div>
    </div>
  );
}
