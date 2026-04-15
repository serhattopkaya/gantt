import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Project, AppTask, ViewModeKey } from '../types';
import { loadState, saveState } from '../lib/storage';
import { createSeedData } from '../lib/seed';

interface StoreState {
  projects: Project[];
  tasks: AppTask[];
  currentProjectId: string | null;
  viewMode: ViewModeKey;
  hydrated: boolean;

  // project actions
  addProject: (input: { name: string; color: string }) => Project;
  updateProject: (id: string, patch: Partial<Pick<Project, 'name' | 'color'>>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;

  // task actions
  addTask: (input: Omit<AppTask, 'id' | 'displayOrder'>) => AppTask;
  updateTask: (id: string, patch: Partial<Omit<AppTask, 'id' | 'projectId'>>) => void;
  deleteTask: (id: string) => void;

  // ui actions
  setViewMode: (mode: ViewModeKey) => void;

  // persistence
  hydrate: () => void;
}

export const useAppStore = create<StoreState>((set, get) => ({
  projects: [],
  tasks: [],
  currentProjectId: null,
  viewMode: 'Week',
  hydrated: false,

  addProject({ name, color }) {
    const now = new Date().toISOString();
    const project: Project = {
      id: uuid(),
      name,
      color,
      createdAt: now,
      updatedAt: now,
    };
    set(s => ({ projects: [...s.projects, project] }));
    return project;
  },

  updateProject(id, patch) {
    set(s => ({
      projects: s.projects.map(p =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  deleteProject(id) {
    set(s => {
      const remaining = s.projects.filter(p => p.id !== id);
      let nextCurrentId = s.currentProjectId;
      if (nextCurrentId === id) {
        nextCurrentId = remaining.length > 0 ? remaining[0].id : null;
      }
      return {
        projects: remaining,
        tasks: s.tasks.filter(t => t.projectId !== id),
        currentProjectId: nextCurrentId,
      };
    });
  },

  setCurrentProject(id) {
    set({ currentProjectId: id });
  },

  addTask(input) {
    const { tasks } = get();
    const projectTasks = tasks.filter(t => t.projectId === input.projectId);
    const maxOrder = projectTasks.reduce((m, t) => Math.max(m, t.displayOrder), -1);
    const task: AppTask = {
      ...input,
      id: uuid(),
      displayOrder: maxOrder + 1,
      // Enforce milestone constraint
      end: input.type === 'milestone' ? input.start : input.end,
      progress: input.type === 'milestone' ? 0 : input.progress,
    };
    set(s => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask(id, patch) {
    set(s => ({
      tasks: s.tasks.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...patch };
        // Enforce milestone constraints
        if (updated.type === 'milestone') {
          updated.end = updated.start;
          updated.progress = 0;
        }
        // Strip self-reference from dependencies
        updated.dependencies = (updated.dependencies ?? []).filter(dep => dep !== id);
        return updated;
      }),
    }));
  },

  deleteTask(id) {
    set(s => ({
      tasks: s.tasks
        .filter(t => t.id !== id)
        .map(t => ({
          ...t,
          dependencies: t.dependencies.filter(dep => dep !== id),
        })),
    }));
  },

  setViewMode(mode) {
    set({ viewMode: mode });
  },

  hydrate() {
    const saved = loadState();
    if (saved) {
      set({
        projects: saved.projects,
        tasks: saved.tasks,
        currentProjectId: saved.currentProjectId,
        viewMode: saved.viewMode,
        hydrated: true,
      });
    } else {
      // First run: seed demo data
      const { project, tasks } = createSeedData();
      set({
        projects: [project],
        tasks,
        currentProjectId: project.id,
        viewMode: 'Week',
        hydrated: true,
      });
    }
  },
}));

// Subscribe to persist changes to localStorage
useAppStore.subscribe((state, prev) => {
  if (!state.hydrated) return;
  if (
    state.projects === prev.projects &&
    state.tasks === prev.tasks &&
    state.currentProjectId === prev.currentProjectId &&
    state.viewMode === prev.viewMode
  ) return;
  saveState({
    version: 1,
    projects: state.projects,
    tasks: state.tasks,
    currentProjectId: state.currentProjectId,
    viewMode: state.viewMode,
  });
});
