import { useAppStore } from '../../store/useAppStore';
import { TODAY } from '../../constants';
import { fmt } from '../../utils/dateUtils';
import type { ProjectData } from '../../types';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { theme, objectName, works, activeWorkId, setTheme, setActiveWorkId, addWork, importData } =
    useAppStore();

  const handleExport = () => {
    const { objectName, works } = useAppStore.getState();
    const blob = new Blob([JSON.stringify({ objectName, works }, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${objectName || 'project'}.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ProjectData;
        if (data.works && Array.isArray(data.works)) {
          importData(data);
        } else {
          alert('Невірний формат файлу!');
        }
      } catch {
        alert('Помилка при читанні файлу!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <aside className={`${styles.sidebar} no-print`}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>ПРОГНОЗ ВИКОНАННЯ</div>
          <div className={styles.date}>{fmt(TODAY)}</div>
        </div>
        <button
          className={styles.themeToggle}
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label="Змінити тему"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <nav className={styles.nav}>
        <button
          className={`${styles.navItem} ${activeWorkId === 'main' ? styles.navItemActive : ''}`}
          onClick={() => setActiveWorkId('main')}
        >
          🏠 Об&apos;єкт: {objectName || 'Новий'}
        </button>

        <div className={styles.divider} />
        <div className={styles.navGroupLabel}>Роботи</div>

        {works.map((w) => (
          <button
            key={w.id}
            className={`${styles.navItem} ${styles.navItemWork} ${activeWorkId === w.id ? styles.navItemWorkActive : ''}`}
            onClick={() => setActiveWorkId(w.id)}
          >
            {w.workName}
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.addBtn} onClick={addWork}>
          + Додати роботу
        </button>
        <div className={styles.ioRow}>
          <button className={styles.ioBtn} onClick={handleExport}>
            Експорт
          </button>
          <label className={styles.ioBtn}>
            Імпорт
            <input type="file" accept=".json" onChange={handleImport} className={styles.fileInput} />
          </label>
        </div>
      </div>
    </aside>
  );
}
