import type { Project, AppTask, ProjectNote, StoredState, ViewModeKey } from '../types';
import { isValidStoredState } from './storage';

export interface ExportBundle {
  version: 2;
  projects: Project[];
  tasks: AppTask[];
  notes: ProjectNote[];
  currentProjectId: string | null;
  viewMode: ViewModeKey;
}

export function buildExportBundle(state: {
  projects: Project[];
  tasks: AppTask[];
  notes: ProjectNote[];
  currentProjectId: string | null;
  viewMode: ViewModeKey;
}): ExportBundle {
  return {
    version: 2,
    projects: state.projects,
    tasks: state.tasks,
    notes: state.notes,
    currentProjectId: state.currentProjectId,
    viewMode: state.viewMode,
  };
}

export function downloadJSON(bundle: ExportBundle, filename = 'gantt-export.json') {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, filename);
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function tasksToCSV(tasks: AppTask[], nameLookup: Map<string, string>): string {
  const header = ['id', 'name', 'type', 'start', 'end', 'progress', 'dependencies'];
  const rows = tasks.map(t => [
    t.id,
    csvEscape(t.name),
    t.type,
    t.start,
    t.end,
    String(t.progress),
    csvEscape(t.dependencies.map(d => nameLookup.get(d) ?? d).join('; ')),
  ].join(','));
  return [header.join(','), ...rows].join('\r\n');
}

export function downloadProjectCSV(project: Project, tasks: AppTask[]) {
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const nameLookup = new Map(projectTasks.map(t => [t.id, t.name]));
  const csv = tasksToCSV(projectTasks, nameLookup);
  const safeName = project.name.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
  triggerDownload(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    `${safeName || 'project'}-tasks.csv`
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function readJSONFile(file: File): Promise<StoredState> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }
  if (!isValidStoredState(parsed)) {
    throw new Error('JSON does not match the expected Gantt export schema.');
  }
  return { ...parsed, version: 2 } as StoredState;
}
