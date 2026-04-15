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

export type ViewModeKey = 'Day' | 'Week' | 'Month';

export interface StoredState {
  version: 1;
  projects: Project[];
  tasks: AppTask[];
  currentProjectId: string | null;
  viewMode: ViewModeKey;
}
