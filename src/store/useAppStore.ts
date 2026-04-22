import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Work, ThemeName, Project, ProjectData } from '../types';

// Shape of v0 persisted data (before multi-project support)
interface PersistedV0 {
  theme?: ThemeName;
  objectName?: string;
  works?: Array<Omit<Work, 'contractor'> & { contractor?: string }>;
}

const DEFAULT_WORKS: Work[] = [
  {
    id: 1,
    workName: 'Монолітні роботи',
    unit: 'м³',
    totalVol: 4000,
    doneVol: 1400,
    mode: 'history',
    weeksWorked: 18,
    manualRate: 7.8,
    brigades: 2,
    plannedStartDate: '',
    contractor: '',
  },
];

const DEFAULT_PROJECTS: Project[] = [{ id: 1, name: "Новий об'єкт", works: DEFAULT_WORKS }];

interface AppState {
  theme: ThemeName;
  projects: Project[];
  activeProjectId: number;
  activeWorkId: number | 'main';

  setTheme: (theme: ThemeName) => void;
  setActiveProjectId: (id: number) => void;
  setActiveWorkId: (id: number | 'main') => void;

  addProject: () => void;
  removeProject: (id: number) => void;
  renameProject: (id: number, name: string) => void;

  addWork: () => void;
  removeWork: (id: number) => void;
  updateWork: (id: number, fields: Partial<Work>) => void;

  importData: (data: ProjectData) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      projects: DEFAULT_PROJECTS,
      activeProjectId: 1,
      activeWorkId: 'main',

      setTheme: (theme) => set({ theme }),

      setActiveProjectId: (id) => set({ activeProjectId: id, activeWorkId: 'main' }),

      setActiveWorkId: (activeWorkId) => set({ activeWorkId }),

      addProject: () =>
        set((state) => {
          const newId =
            state.projects.length > 0 ? Math.max(...state.projects.map((p) => p.id)) + 1 : 1;
          return {
            projects: [...state.projects, { id: newId, name: `Новий об'єкт ${newId}`, works: [] }],
            activeProjectId: newId,
            activeWorkId: 'main',
          };
        }),

      removeProject: (id) =>
        set((state) => {
          if (state.projects.length <= 1) return state;
          const remaining = state.projects.filter((p) => p.id !== id);
          const newActiveId =
            state.activeProjectId === id ? remaining[0].id : state.activeProjectId;
          return { projects: remaining, activeProjectId: newActiveId, activeWorkId: 'main' };
        }),

      renameProject: (id, name) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      addWork: () =>
        set((state) => {
          const project = state.projects.find((p) => p.id === state.activeProjectId);
          if (!project) return state;
          const newId =
            project.works.length > 0 ? Math.max(...project.works.map((w) => w.id)) + 1 : 1;
          const newWork: Work = {
            id: newId,
            workName: `Нова робота ${newId}`,
            unit: 'м³',
            totalVol: 1000,
            doneVol: 0,
            mode: 'manual',
            weeksWorked: 0,
            manualRate: 10,
            brigades: 1,
            plannedStartDate: '',
            contractor: '',
          };
          return {
            projects: state.projects.map((p) =>
              p.id === state.activeProjectId ? { ...p, works: [...p.works, newWork] } : p,
            ),
            activeWorkId: newId,
          };
        }),

      removeWork: (id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.activeProjectId
              ? { ...p, works: p.works.filter((w) => w.id !== id) }
              : p,
          ),
          activeWorkId: 'main',
        })),

      updateWork: (id, fields) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.activeProjectId
              ? { ...p, works: p.works.map((w) => (w.id === id ? { ...w, ...fields } : w)) }
              : p,
          ),
        })),

      // Imports as a NEW project and switches to it; does not overwrite existing data
      importData: (data) =>
        set((state) => {
          const newId =
            state.projects.length > 0 ? Math.max(...state.projects.map((p) => p.id)) + 1 : 1;
          const works: Work[] = data.works.map((w) => ({ ...w, contractor: w.contractor ?? '' }));
          return {
            projects: [
              ...state.projects,
              { id: newId, name: data.name || "Імпортований об'єкт", works },
            ],
            activeProjectId: newId,
            activeWorkId: 'main',
          };
        }),
    }),
    {
      name: 'ctc_store',
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          const old = persistedState as PersistedV0;
          return {
            theme: old.theme ?? 'light',
            projects: [
              {
                id: 1,
                name: old.objectName ?? "Новий об'єкт",
                works: (old.works ?? []).map((w) => ({ ...w, contractor: w.contractor ?? '' })),
              },
            ],
            activeProjectId: 1,
          };
        }
        return persistedState as Record<string, unknown>;
      },
      partialize: (state) => ({
        theme: state.theme,
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        // activeWorkId is intentionally excluded — always resets to 'main' on page load
      }),
    },
  ),
);

export const useActiveProject = () =>
  useAppStore((state) => state.projects.find((p) => p.id === state.activeProjectId));
