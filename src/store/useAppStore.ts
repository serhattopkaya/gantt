import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  Project,
  AppTask,
  ViewModeKey,
  ThemeKey,
  DisplayMode,
  AppView,
} from '../types';
import { loadState, saveState } from '../lib/storage';
import { createSeedData, SEED_MARKER_NAME } from '../lib/seed';
import { fromISODate, toISODate, addDays } from '../lib/dates';

interface StoreState {
  projects: Project[];
  tasks: AppTask[];
  currentProjectId: string | null;
  viewMode: ViewModeKey;
  theme: ThemeKey;
  displayMode: DisplayMode;
  view: AppView;
  sidebarCollapsed: boolean;
  seedDismissed: boolean;
  collapsedGroupIds: string[];
  hydrated: boolean;

  // project actions
  addProject: (input: { name: string; color: string }) => Project;
  updateProject: (id: string, patch: Partial<Pick<Project, 'name' | 'color'>>) => void;
  deleteProject: (id: string) => void;
  restoreProject: (project: Project, tasks: AppTask[]) => void;
  setCurrentProject: (id: string | null) => void;

  // task actions
  addTask: (input: Omit<AppTask, 'id' | 'displayOrder'>) => AppTask;
  updateTask: (id: string, patch: Partial<Omit<AppTask, 'id' | 'projectId'>>) => void;
  deleteTask: (id: string) => void;
  restoreTask: (task: AppTask, dependents: Array<{ id: string; dependencies: string[] }>) => void;
  bulkSetProgress: (ids: string[], progress: number) => void;
  bulkShiftTasks: (ids: string[], days: number) => void;
  bulkDeleteTasks: (ids: string[]) => { tasks: AppTask[]; dependents: Array<{ id: string; dependencies: string[] }> };
  bulkRestoreTasks: (tasks: AppTask[], dependents: Array<{ id: string; dependencies: string[] }>) => void;

  // ui actions
  setViewMode: (mode: ViewModeKey) => void;
  setTheme: (t: ThemeKey) => void;
  setDisplayMode: (m: DisplayMode) => void;
  setView: (v: AppView) => void;
  setSidebarCollapsed: (c: boolean) => void;
  toggleSidebar: () => void;
  toggleGroupCollapsed: (id: string) => void;
  setGroupCollapsed: (id: string, collapsed: boolean) => void;
  dismissSeed: () => void;
  clearSeedData: () => void;

  // persistence
  hydrate: () => void;
  replaceAll: (input: { projects: Project[]; tasks: AppTask[]; currentProjectId?: string | null; viewMode?: ViewModeKey }) => void;
}

export function detectSeeded(projects: Project[], tasks: AppTask[]): boolean {
  if (projects.length !== 1) return false;
  if (projects[0].name !== SEED_MARKER_NAME) return false;
  return tasks.every(t => t.projectId === projects[0].id);
}

export const selectIsSeeded = (s: StoreState) => detectSeeded(s.projects, s.tasks);

function shiftIso(iso: string, days: number): string {
  return toISODate(addDays(fromISODate(iso), days));
}

export const useAppStore = create<StoreState>((set, get) => ({
  projects: [],
  tasks: [],
  currentProjectId: null,
  viewMode: 'Week',
  theme: 'system',
  displayMode: 'gantt',
  view: 'project',
  sidebarCollapsed: false,
  seedDismissed: false,
  collapsedGroupIds: [],
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
      const doomedTaskIds = new Set(s.tasks.filter(t => t.projectId === id).map(t => t.id));
      return {
        projects: remaining,
        tasks: s.tasks.filter(t => t.projectId !== id),
        currentProjectId: nextCurrentId,
        collapsedGroupIds: s.collapsedGroupIds.filter(g => !doomedTaskIds.has(g)),
      };
    });
  },

  restoreProject(project, projectTasks) {
    set(s => {
      if (s.projects.some(p => p.id === project.id)) return s;
      const existingTaskIds = new Set(s.tasks.map(t => t.id));
      const tasksToAdd = projectTasks.filter(t => !existingTaskIds.has(t.id));
      return {
        projects: [...s.projects, project],
        tasks: [...s.tasks, ...tasksToAdd],
        currentProjectId: s.currentProjectId ?? project.id,
      };
    });
  },

  setCurrentProject(id) {
    set({ currentProjectId: id });
  },

  addTask(input) {
    const { tasks } = get();
    const projectTasks = tasks.filter(t => t.projectId === input.projectId);
    const projectTaskIds = new Set(projectTasks.map(t => t.id));
    const projectGroupIds = new Set(projectTasks.filter(t => t.type === 'group').map(t => t.id));
    const maxOrder = projectTasks.reduce((m, t) => Math.max(m, t.displayOrder), -1);
    const isGroup = input.type === 'group';
    const isMilestone = input.type === 'milestone';
    const parentId =
      !isGroup && input.parentId && projectGroupIds.has(input.parentId) ? input.parentId : undefined;
    const task: AppTask = {
      ...input,
      id: uuid(),
      displayOrder: maxOrder + 1,
      end: isMilestone ? input.start : input.end,
      progress:
        isMilestone || isGroup ? 0 : Math.max(0, Math.min(100, input.progress)),
      dependencies: (input.dependencies ?? []).filter(dep => projectTaskIds.has(dep)),
      parentId,
    };
    set(s => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask(id, patch) {
    set(s => {
      const target = s.tasks.find(t => t.id === id);
      if (!target) return s;
      const projectSiblings = s.tasks.filter(t => t.projectId === target.projectId && t.id !== id);
      const siblingIds = new Set(projectSiblings.map(t => t.id));
      const groupIds = new Set(projectSiblings.filter(t => t.type === 'group').map(t => t.id));
      return {
        tasks: s.tasks.map(t => {
          if (t.id !== id) return t;
          const updated = { ...t, ...patch };
          if (updated.type === 'milestone') {
            updated.end = updated.start;
            updated.progress = 0;
          } else if (updated.type === 'group') {
            updated.progress = 0;
            updated.parentId = undefined;
          } else if (typeof patch.progress === 'number') {
            updated.progress = Math.max(0, Math.min(100, patch.progress));
          }
          if (updated.type !== 'group' && updated.parentId && !groupIds.has(updated.parentId)) {
            updated.parentId = undefined;
          }
          // Drop self-refs and dangling ids pointing to other projects / deleted tasks
          updated.dependencies = (updated.dependencies ?? []).filter(
            dep => dep !== id && siblingIds.has(dep)
          );
          return updated;
        }),
      };
    });
  },

  deleteTask(id) {
    set(s => ({
      tasks: s.tasks
        .filter(t => t.id !== id)
        .map(t => ({
          ...t,
          dependencies: t.dependencies.filter(dep => dep !== id),
          parentId: t.parentId === id ? undefined : t.parentId,
        })),
      collapsedGroupIds: s.collapsedGroupIds.filter(g => g !== id),
    }));
  },

  restoreTask(task, dependents) {
    set(s => {
      if (s.tasks.some(t => t.id === task.id)) return s;
      const depPatches = new Map(dependents.map(d => [d.id, d.dependencies]));
      return {
        tasks: [
          ...s.tasks.map(t =>
            depPatches.has(t.id) ? { ...t, dependencies: depPatches.get(t.id)! } : t
          ),
          task,
        ],
      };
    });
  },

  bulkSetProgress(ids, progress) {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const clamped = Math.max(0, Math.min(100, progress));
    set(s => ({
      tasks: s.tasks.map(t => {
        if (!idSet.has(t.id) || t.type !== 'task') return t;
        return { ...t, progress: clamped };
      }),
    }));
  },

  bulkShiftTasks(ids, days) {
    if (ids.length === 0 || days === 0) return;
    const idSet = new Set(ids);
    set(s => ({
      tasks: s.tasks.map(t => {
        if (!idSet.has(t.id)) return t;
        const start = shiftIso(t.start, days);
        return {
          ...t,
          start,
          end: t.type === 'milestone' ? start : shiftIso(t.end, days),
        };
      }),
    }));
  },

  bulkDeleteTasks(ids) {
    const snapshot: AppTask[] = [];
    const depSnapshots: Array<{ id: string; dependencies: string[] }> = [];
    const idSet = new Set(ids);
    const { tasks } = get();
    for (const t of tasks) {
      if (idSet.has(t.id)) {
        snapshot.push(t);
      } else if (t.dependencies.some(d => idSet.has(d))) {
        depSnapshots.push({ id: t.id, dependencies: [...t.dependencies] });
      }
    }
    set(s => ({
      tasks: s.tasks
        .filter(t => !idSet.has(t.id))
        .map(t => ({
          ...t,
          dependencies: t.dependencies.filter(d => !idSet.has(d)),
          parentId: t.parentId && idSet.has(t.parentId) ? undefined : t.parentId,
        })),
      collapsedGroupIds: s.collapsedGroupIds.filter(g => !idSet.has(g)),
    }));
    return { tasks: snapshot, dependents: depSnapshots };
  },

  bulkRestoreTasks(tasksToRestore, dependents) {
    if (tasksToRestore.length === 0) return;
    set(s => {
      const existingIds = new Set(s.tasks.map(t => t.id));
      const toAdd = tasksToRestore.filter(t => !existingIds.has(t.id));
      if (toAdd.length === 0 && dependents.length === 0) return s;
      const patches = new Map(dependents.map(d => [d.id, d.dependencies]));
      return {
        tasks: [
          ...s.tasks.map(t =>
            patches.has(t.id) ? { ...t, dependencies: patches.get(t.id)! } : t
          ),
          ...toAdd,
        ],
      };
    });
  },

  setViewMode(mode) {
    set({ viewMode: mode });
  },

  setTheme(t) {
    set({ theme: t });
  },

  setDisplayMode(m) {
    set({ displayMode: m });
  },

  setView(v) {
    set({ view: v });
  },

  setSidebarCollapsed(c) {
    set({ sidebarCollapsed: c });
  },

  toggleSidebar() {
    set(s => ({ sidebarCollapsed: !s.sidebarCollapsed }));
  },

  toggleGroupCollapsed(id) {
    set(s => ({
      collapsedGroupIds: s.collapsedGroupIds.includes(id)
        ? s.collapsedGroupIds.filter(g => g !== id)
        : [...s.collapsedGroupIds, id],
    }));
  },

  setGroupCollapsed(id, collapsed) {
    set(s => {
      const has = s.collapsedGroupIds.includes(id);
      if (collapsed && !has) return { collapsedGroupIds: [...s.collapsedGroupIds, id] };
      if (!collapsed && has) return { collapsedGroupIds: s.collapsedGroupIds.filter(g => g !== id) };
      return s;
    });
  },

  dismissSeed() {
    set({ seedDismissed: true });
  },

  clearSeedData() {
    set(s => {
      if (!detectSeeded(s.projects, s.tasks)) return s;
      return {
        projects: [],
        tasks: [],
        currentProjectId: null,
        seedDismissed: true,
      };
    });
  },

  hydrate() {
    const saved = loadState();
    if (saved) {
      const taskIds = new Set(saved.tasks.map(t => t.id));
      const collapsed = (saved.collapsedGroupIds ?? []).filter(id => taskIds.has(id));
      set({
        projects: saved.projects,
        tasks: saved.tasks,
        currentProjectId: saved.currentProjectId,
        viewMode: saved.viewMode,
        theme: saved.theme ?? 'system',
        displayMode: saved.displayMode ?? 'gantt',
        view: saved.view ?? 'project',
        sidebarCollapsed: saved.sidebarCollapsed ?? false,
        seedDismissed: saved.seedDismissed ?? false,
        collapsedGroupIds: collapsed,
        hydrated: true,
      });
    } else {
      const { project, tasks } = createSeedData();
      set({
        projects: [project],
        tasks,
        currentProjectId: project.id,
        viewMode: 'Week',
        theme: 'system',
        displayMode: 'gantt',
        view: 'project',
        sidebarCollapsed: false,
        seedDismissed: false,
        collapsedGroupIds: [],
        hydrated: true,
      });
    }
  },

  replaceAll({ projects, tasks, currentProjectId, viewMode }) {
    const nextCurrent = currentProjectId !== undefined
      ? currentProjectId
      : (projects.find(p => p.id === get().currentProjectId)?.id ?? projects[0]?.id ?? null);
    const taskIds = new Set(tasks.map(t => t.id));
    set({
      projects,
      tasks,
      currentProjectId: nextCurrent,
      viewMode: viewMode ?? get().viewMode,
      seedDismissed: true,
      collapsedGroupIds: get().collapsedGroupIds.filter(g => taskIds.has(g)),
    });
  },
}));

useAppStore.subscribe((state, prev) => {
  if (!state.hydrated) return;
  if (
    state.projects === prev.projects &&
    state.tasks === prev.tasks &&
    state.currentProjectId === prev.currentProjectId &&
    state.viewMode === prev.viewMode &&
    state.theme === prev.theme &&
    state.displayMode === prev.displayMode &&
    state.view === prev.view &&
    state.sidebarCollapsed === prev.sidebarCollapsed &&
    state.seedDismissed === prev.seedDismissed &&
    state.collapsedGroupIds === prev.collapsedGroupIds
  ) return;
  saveState({
    version: 3,
    projects: state.projects,
    tasks: state.tasks,
    currentProjectId: state.currentProjectId,
    viewMode: state.viewMode,
    theme: state.theme,
    displayMode: state.displayMode,
    view: state.view,
    sidebarCollapsed: state.sidebarCollapsed,
    seedDismissed: state.seedDismissed,
    collapsedGroupIds: state.collapsedGroupIds,
  });
});
