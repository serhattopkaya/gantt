export type AppTaskType = 'task' | 'milestone';

export interface Project {
  id: string;
  name: string;
  color: string; // hex from preset palette
  createdAt: string;
  updatedAt: string;
}

export interface AppTask {
  id: string;
  projectId: string;
  type: AppTaskType;
  name: string;
  start: string; // ISO date string
  end: string;   // ISO date string; milestone: end === start
  progress: number; // 0..100
  dependencies: string[]; // AppTask.id values in same project
  displayOrder: number;
}

export const VIEW_MODES = ['Day', 'Week', 'Month', 'Quarter', 'Year'] as const;
export type ViewModeKey = typeof VIEW_MODES[number];

export const THEMES = ['light', 'dark', 'system'] as const;
export type ThemeKey = typeof THEMES[number];

export const DISPLAY_MODES = ['gantt', 'list'] as const;
export type DisplayMode = typeof DISPLAY_MODES[number];

export const APP_VIEWS = ['dashboard', 'project'] as const;
export type AppView = typeof APP_VIEWS[number];

export interface StoredState {
  version: 2;
  projects: Project[];
  tasks: AppTask[];
  currentProjectId: string | null;
  viewMode: ViewModeKey;
  theme?: ThemeKey;
  displayMode?: DisplayMode;
  view?: AppView;
  sidebarCollapsed?: boolean;
  seedDismissed?: boolean;
}
