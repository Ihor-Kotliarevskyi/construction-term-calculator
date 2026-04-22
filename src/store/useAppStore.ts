import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Work, ThemeName, ProjectData } from '../types';

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
  },
];

interface AppState {
  theme: ThemeName;
  objectName: string;
  works: Work[];
  activeWorkId: number | 'main';

  setTheme: (theme: ThemeName) => void;
  setObjectName: (name: string) => void;
  setActiveWorkId: (id: number | 'main') => void;
  updateWork: (id: number, fields: Partial<Work>) => void;
  addWork: () => void;
  removeWork: (id: number) => void;
  importData: (data: ProjectData) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      objectName: "Новий об'єкт",
      works: DEFAULT_WORKS,
      activeWorkId: 'main',

      setTheme: (theme) => set({ theme }),
      setObjectName: (objectName) => set({ objectName }),
      setActiveWorkId: (activeWorkId) => set({ activeWorkId }),

      updateWork: (id, fields) =>
        set((state) => ({
          works: state.works.map((w) => (w.id === id ? { ...w, ...fields } : w)),
        })),

      addWork: () =>
        set((state) => {
          const newId =
            state.works.length > 0 ? Math.max(...state.works.map((w) => w.id)) + 1 : 1;
          return {
            works: [
              ...state.works,
              {
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
              },
            ],
            activeWorkId: newId,
          };
        }),

      removeWork: (id) =>
        set((state) => ({
          works: state.works.filter((w) => w.id !== id),
          activeWorkId: 'main',
        })),

      importData: (data) =>
        set({
          objectName: data.objectName || "Новий об'єкт",
          works: data.works,
          activeWorkId: 'main',
        }),
    }),
    {
      name: 'ctc_store',
      partialize: (state) => ({
        theme: state.theme,
        objectName: state.objectName,
        works: state.works,
      }),
    },
  ),
);
