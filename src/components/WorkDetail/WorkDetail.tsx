import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { calculateWork } from '../../utils/calculations';
import { fmt } from '../../utils/dateUtils';
import { TODAY, UNITS } from '../../constants';
import { NumField } from '../ui/NumField';
import { Chip } from '../ui/Chip';
import { StatCard } from '../ui/StatCard';
import { GanttChart } from '../GanttChart/GanttChart';
import styles from './WorkDetail.module.css';

interface Props {
  workId: number;
}

export function WorkDetail({ workId }: Props) {
  const { works, updateWork, removeWork } = useAppStore();
  const work = works.find((w) => w.id === workId);
  const calc = useMemo(() => (work ? calculateWork(work) : null), [work]);

  if (!work || !calc) return null;

  const progressColorClass =
    calc.progress < 30 ? styles.colorRed : calc.progress < 65 ? styles.colorAccent : styles.colorGood;
  const fillClass =
    calc.progress < 30 ? styles.fillRed : calc.progress < 65 ? styles.fillAccent : styles.fillGood;

  return (
    <div className={`${styles.root} no-print`}>
      <div className={styles.header}>
        <h1 className={styles.title}>{work.workName}</h1>
        <button className={styles.deleteBtn} onClick={() => removeWork(work.id)}>
          Видалити роботу
        </button>
      </div>

      <div className={styles.grid}>
        {/* ── Inputs ──────────────────────────────────────── */}
        <div className={styles.inputsPanel}>
          <div className={styles.sectionLabel}>Вхідні дані</div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Назва роботи</label>
            <input
              className={styles.textInput}
              value={work.workName}
              onChange={(e) => updateWork(work.id, { workName: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.fieldLabel}>Одиниці виміру</div>
            <div className={styles.chips}>
              {UNITS.map((u) => (
                <Chip key={u} active={work.unit === u} onClick={() => updateWork(work.id, { unit: u })}>
                  {u}
                </Chip>
              ))}
            </div>
          </div>

          <NumField
            label="Загальний проектний обсяг"
            value={work.totalVol}
            onChange={(v) => updateWork(work.id, { totalVol: v })}
            unit={work.unit}
            min={1}
          />
          <NumField
            label={`Виконано (на ${fmt(TODAY)})`}
            value={work.doneVol}
            onChange={(v) => updateWork(work.id, { doneVol: v })}
            unit={work.unit}
            min={0}
          />

          {work.doneVol === 0 && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Запланована дата початку</label>
              <input
                type="date"
                className={styles.dateInput}
                value={work.plannedStartDate}
                onChange={(e) => updateWork(work.id, { plannedStartDate: e.target.value })}
              />
            </div>
          )}

          <div className={styles.fieldLabel} style={{ margin: '14px 0 8px' }}>
            Швидкість виконання
          </div>
          <div className={styles.modeSelector}>
            {(['history', 'manual'] as const).map((m, i) => (
              <button
                key={m}
                className={`${styles.modeBtn} ${work.mode === m ? styles.modeBtnActive : ''} ${i === 0 ? styles.modeBtnBorder : ''}`}
                onClick={() => updateWork(work.id, { mode: m })}
              >
                {m === 'history' ? 'З історії' : 'Вручну'}
              </button>
            ))}
          </div>

          {work.mode === 'history' ? (
            <>
              <NumField
                label="Відпрацьовано тижнів"
                value={work.weeksWorked}
                onChange={(v) => updateWork(work.id, { weeksWorked: v })}
                unit="тиж."
                min={0.5}
                step={0.5}
              />
              <div className={styles.rateBox}>
                Розрахунковий темп:{' '}
                <span className={styles.rateValue}>
                  {work.weeksWorked > 0 ? (work.doneVol / work.weeksWorked).toFixed(1) : '—'}
                </span>{' '}
                {work.unit}/тиж.
              </div>
            </>
          ) : (
            <>
              <NumField
                label="Темп на бригаду"
                value={work.manualRate}
                onChange={(v) => updateWork(work.id, { manualRate: v })}
                unit={`${work.unit}/тиж.`}
                min={0.1}
                step={0.5}
              />
              <NumField
                label="Кількість бригад"
                value={work.brigades}
                onChange={(v) => updateWork(work.id, { brigades: v })}
                unit="бр."
                min={1}
              />
              <div className={styles.rateBox}>
                Загальний темп:{' '}
                <span className={styles.rateValue}>
                  {(work.manualRate * work.brigades).toFixed(1)}
                </span>{' '}
                {work.unit}/тиж.
              </div>
            </>
          )}
        </div>

        {/* ── Results ─────────────────────────────────────── */}
        <div className={styles.resultsPanel}>
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Готовність поточної роботи</span>
              <span className={`${styles.progressPct} ${progressColorClass}`}>
                {calc.progress.toFixed(1)}%
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${fillClass}`}
                style={{ width: `${calc.progress}%` }}
              />
            </div>
            <div className={styles.progressMeta}>
              <span>
                {work.doneVol.toLocaleString()} {work.unit}
              </span>
              <span>
                {work.totalVol.toLocaleString()} {work.unit}
              </span>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <StatCard label="Залишок" value={`${calc.remaining.toLocaleString()} ${work.unit}`} />
            <StatCard
              label="Темп"
              value={`${calc.ratePerWeek > 0 ? calc.ratePerWeek.toFixed(1) : '—'} ${work.unit}`}
              sub="на тиждень"
            />
            <StatCard
              label="Тижнів залишилось"
              value={calc.weeksLeft !== null ? calc.weeksLeft.toFixed(1) : '—'}
              sub={calc.weeksLeft !== null ? `≈ ${(calc.weeksLeft / 4.33).toFixed(1)} міс.` : ''}
            />
            <StatCard
              label={work.doneVol === 0 ? 'Запланований початок' : 'Дата відліку / старту'}
              value={fmt(calc.startDate)}
              small
            />
          </div>

          <div className={styles.completionCard}>
            <div className={styles.completionLabel}>🏗 Прогнозована дата завершення</div>
            <div className={styles.completionDate}>{calc.endDate ? fmt(calc.endDate) : '—'}</div>
            {calc.endDate && (
              <div className={styles.completionMeta}>
                темп {calc.ratePerWeek.toFixed(1)} {work.unit}/тиж · залишок{' '}
                {calc.remaining.toLocaleString()} {work.unit}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.ganttPanel}>
        <div className={styles.ganttTitle}>Графік роботи</div>
        <GanttChart works={[work]} calculations={{ [work.id]: calc }} activeWorkId={workId} />
      </div>
    </div>
  );
}
