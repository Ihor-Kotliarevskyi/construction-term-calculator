import { useMemo } from 'react';
import html2canvas from 'html2canvas';
import { useAppStore } from '../../store/useAppStore';
import { calculateWork } from '../../utils/calculations';
import { fmt } from '../../utils/dateUtils';
import { THEME_BG } from '../../constants';
import { StatCard } from '../ui/StatCard';
import { GanttChart } from '../GanttChart/GanttChart';
import styles from './MainObjectTab.module.css';

export function MainObjectTab() {
  const { theme, objectName, works, activeWorkId, setObjectName } = useAppStore();

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

  const handlePrint = () => window.print();

  const handleSaveImage = () => {
    const el = document.getElementById('main-print-area');
    if (!el) return;
    html2canvas(el, { backgroundColor: THEME_BG[theme] }).then((canvas) => {
      const link = document.createElement('a');
      link.download = `${objectName}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div id="main-print-area" className={styles.root}>
      <div className={styles.header}>
        <input
          className={styles.objectNameInput}
          value={objectName}
          onChange={(e) => setObjectName(e.target.value)}
          placeholder="Введіть назву об'єкта..."
        />
        <div className={`${styles.actions} no-print`}>
          <button onClick={handleSaveImage} className={styles.btnSave}>
            💾 Зберегти PNG
          </button>
          <button onClick={handlePrint} className={styles.btnPrint}>
            🖨 Друк
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
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
        <GanttChart works={works} calculations={calculations} activeWorkId={activeWorkId} />
      </div>
    </div>
  );
}
