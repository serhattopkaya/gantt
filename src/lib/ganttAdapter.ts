import { ViewMode } from 'gantt-task-react';
import type { Task as LibTask } from 'gantt-task-react';
import type { AppTask, Project, ViewModeKey } from '../types';
import { hexWithAlpha } from './colors';

export function toLibTasks(appTasks: AppTask[], project: Project): LibTask[] {
  const accent = project.color;
  return appTasks
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((t): LibTask => ({
      id: t.id,
      name: t.name,
      type: t.type,
      start: new Date(t.start + 'T00:00:00'),
      end: new Date((t.type === 'milestone' ? t.start : t.end) + 'T00:00:00'),
      progress: t.progress,
      dependencies: t.dependencies,
      displayOrder: t.displayOrder,
      styles: {
        backgroundColor: hexWithAlpha(accent, 0.2),
        backgroundSelectedColor: hexWithAlpha(accent, 0.35),
        progressColor: accent,
        progressSelectedColor: accent,
      },
    }));
}

export const viewModeMap: Record<ViewModeKey, ViewMode> = {
  Day: ViewMode.Day,
  Week: ViewMode.Week,
  Month: ViewMode.Month,
  // Quarter zooms out from Month without a true quarter header — the library
  // has no Quarter mode, so we reuse Month with narrower columns.
  Quarter: ViewMode.Month,
  Year: ViewMode.Year,
};

export const columnWidthFor: Record<ViewModeKey, number> = {
  Day: 60,
  Week: 120,
  Month: 260,
  Quarter: 90,
  Year: 300,
};
