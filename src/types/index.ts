export type AppTaskType = 'task' | 'milestone' | 'group';

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
  progress: number; // 0..100; always 0 for group
  dependencies: string[]; // AppTask.id values in same project
  displayOrder: number;
  /** id of an AppTask of type 'group' in the same project. Groups never have a parentId. */
  parentId?: string;
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
  version: 2 | 3;
  projects: Project[];
  tasks: AppTask[];
  currentProjectId: string | null;
  viewMode: ViewModeKey;
  theme?: ThemeKey;
  displayMode?: DisplayMode;
  view?: AppView;
  sidebarCollapsed?: boolean;
  seedDismissed?: boolean;
  collapsedGroupIds?: string[];
}
