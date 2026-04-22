import { useAppStore } from '../../store/useAppStore';
import { TODAY } from '../../constants';
import { fmt } from '../../utils/dateUtils';
import type { ProjectData } from '../../types';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const {
    theme,
    projects,
    activeProjectId,
    activeWorkId,
    setTheme,
    setActiveProjectId,
    setActiveWorkId,
    addProject,
    removeProject,
    renameProject,
    addWork,
    importData,
  } = useAppStore();

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const works = activeProject?.works ?? [];

  // Group works by contractor for nav display
  const worksWithoutContractor = works.filter((w) => !w.contractor);
  const contractorNames = [
    ...new Set(works.filter((w) => w.contractor).map((w) => w.contractor)),
  ].sort((a, b) => a.localeCompare(b, 'uk'));

  const handleExport = () => {
    const { projects, activeProjectId } = useAppStore.getState();
    const project = projects.find((p) => p.id === activeProjectId);
    if (!project) return;
    const data: ProjectData = { name: project.name, works: project.works };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${project.name || 'project'}.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        if (!Array.isArray(raw?.works)) {
          alert('Невірний формат файлу!');
          return;
        }
        // Support both old format (objectName) and new format (name)
        const data: ProjectData = {
          name: raw.name || raw.objectName || "Імпортований об'єкт",
          works: raw.works,
        };
        importData(data);
      } catch {
        alert('Помилка при читанні файлу!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <aside className={`${styles.sidebar} no-print`}>
      {/* ── Header ── */}
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

      {/* ── Projects ── */}
      <div className={styles.projectsSection}>
        <div className={styles.sectionLabel}>Об&apos;єкти</div>
        {projects.map((project) => {
          const isActive = project.id === activeProjectId;
          return (
            <div key={project.id} className={`${styles.projectRow} ${isActive ? styles.projectRowActive : ''}`}>
              {isActive ? (
                <input
                  className={styles.projectNameInput}
                  value={project.name}
                  onChange={(e) => renameProject(project.id, e.target.value)}
                />
              ) : (
                <button
                  className={styles.projectBtn}
                  onClick={() => setActiveProjectId(project.id)}
                >
                  {project.name}
                </button>
              )}
              {projects.length > 1 && (
                <button
                  className={styles.projectDeleteBtn}
                  onClick={() => removeProject(project.id)}
                  aria-label="Видалити об'єкт"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        <button className={styles.addProjectBtn} onClick={addProject}>
          + Новий об&apos;єкт
        </button>
      </div>

      {/* ── Works nav ── */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navItem} ${activeWorkId === 'main' ? styles.navItemActive : ''}`}
          onClick={() => setActiveWorkId('main')}
        >
          🏠 Зведений огляд
        </button>

        <div className={styles.divider} />
        <div className={styles.sectionLabel} style={{ padding: '0 14px', marginBottom: 6 }}>
          Роботи
        </div>

        {worksWithoutContractor.map((w) => (
          <button
            key={w.id}
            className={`${styles.navItem} ${styles.navItemWork} ${activeWorkId === w.id ? styles.navItemWorkActive : ''}`}
            onClick={() => setActiveWorkId(w.id)}
          >
            {w.workName}
          </button>
        ))}

        {contractorNames.map((contractor) => (
          <div key={contractor}>
            <div className={styles.contractorLabel}>{contractor}</div>
            {works
              .filter((w) => w.contractor === contractor)
              .map((w) => (
                <button
                  key={w.id}
                  className={`${styles.navItem} ${styles.navItemWork} ${styles.navItemIndented} ${activeWorkId === w.id ? styles.navItemWorkActive : ''}`}
                  onClick={() => setActiveWorkId(w.id)}
                >
                  {w.workName}
                </button>
              ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
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
