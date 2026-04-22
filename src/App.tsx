import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MainObjectTab } from './components/MainObjectTab/MainObjectTab';
import { WorkDetail } from './components/WorkDetail/WorkDetail';
import './styles/global.css';

export default function App() {
  const { theme, activeWorkId } = useAppStore();

  return (
    <div
      data-theme={theme}
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: "'DM Sans', sans-serif",
        overflow: 'hidden',
        background: 'var(--bg)',
        color: 'var(--text)',
        transition: 'background 0.3s, color 0.3s',
      }}
    >
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {activeWorkId === 'main' ? (
          <MainObjectTab />
        ) : (
          <WorkDetail workId={activeWorkId} />
        )}
      </main>
    </div>
  );
}
