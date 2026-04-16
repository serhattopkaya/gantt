import { ViewMode } from 'gantt-task-react';
import type { Task as LibTask } from 'gantt-task-react';
import type { AppTask, Project, ViewModeKey } from '../types';
import { hexWithAlpha } from './colors';

/**
 * Nested order: groups come before their children. Within each bucket we
 * respect the task's own displayOrder, then append orphans at the end.
 */
export function orderNested(appTasks: AppTask[]): AppTask[] {
  const byOrder = [...appTasks].sort((a, b) => a.displayOrder - b.displayOrder);
  const groupIds = new Set(byOrder.filter(t => t.type === 'group').map(t => t.id));
  const childrenByParent = new Map<string, AppTask[]>();
  const orphans: AppTask[] = [];
  const groups: AppTask[] = [];

  for (const t of byOrder) {
    if (t.type === 'group') {
      groups.push(t);
    } else if (t.parentId && groupIds.has(t.parentId)) {
      const bucket = childrenByParent.get(t.parentId) ?? [];
      bucket.push(t);
      childrenByParent.set(t.parentId, bucket);
    } else {
      orphans.push(t);
    }
  }

  const result: AppTask[] = [];
  for (const g of groups) {
    result.push(g);
    const kids = childrenByParent.get(g.id);
    if (kids) result.push(...kids);
  }
  result.push(...orphans);
  return result;
}

export function toLibTasks(
  appTasks: AppTask[],
  project: Project,
  collapsedGroupIds: ReadonlySet<string> = new Set()
): LibTask[] {
  const accent = project.color;
  const ordered = orderNested(appTasks);

  // Derive group spans from children so the summary bar reflects them.
  const childrenByParent = new Map<string, AppTask[]>();
  for (const t of appTasks) {
    if (t.type !== 'group' && t.parentId) {
      const bucket = childrenByParent.get(t.parentId) ?? [];
      bucket.push(t);
      childrenByParent.set(t.parentId, bucket);
    }
  }

  return ordered.map((t, index): LibTask => {
    const isGroup = t.type === 'group';
    const isMilestone = t.type === 'milestone';
    let startIso = t.start;
    let endIso = isMilestone ? t.start : t.end;

    if (isGroup) {
      const kids = childrenByParent.get(t.id);
      if (kids && kids.length > 0) {
        startIso = kids.reduce((m, k) => (k.start < m ? k.start : m), kids[0].start);
        endIso = kids.reduce((m, k) => {
          const kEnd = k.type === 'milestone' ? k.start : k.end;
          return kEnd > m ? kEnd : m;
        }, kids[0].type === 'milestone' ? kids[0].start : kids[0].end);
      }
    }

    const libType: LibTask['type'] = isGroup ? 'project' : (t.type as 'task' | 'milestone');
    return {
      id: t.id,
      name: t.name,
      type: libType,
      start: new Date(startIso + 'T00:00:00'),
      end: new Date(endIso + 'T00:00:00'),
      progress: t.progress,
      dependencies: t.dependencies,
      // The library internally re-sorts rows by `displayOrder` (see
      // gantt-task-react/dist/index.js sortTasks), ignoring input array order.
      // Use the position in our nested ordering so groups render above their
      // children instead of in creation order.
      displayOrder: index + 1,
      project: t.parentId,
      hideChildren: isGroup ? collapsedGroupIds.has(t.id) : undefined,
      styles: {
        backgroundColor: hexWithAlpha(accent, 0.2),
        backgroundSelectedColor: hexWithAlpha(accent, 0.35),
        progressColor: accent,
        progressSelectedColor: accent,
      },
    };
  });
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
