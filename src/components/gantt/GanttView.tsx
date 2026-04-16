import 'gantt-task-react/dist/index.css';
import './gantt-overrides.css';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Gantt } from 'gantt-task-react';
import type { Task as LibTask } from 'gantt-task-react';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
import { toLibTasks, viewModeMap, columnWidthFor } from '../../lib/ganttAdapter';
import { toISODate } from '../../lib/dates';
import { useResolvedTheme } from '../../lib/useTheme';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DependentsPreview } from '../common/DependentsPreview';
import { GanttTooltip } from './GanttTooltip';
import type { AppTask, Project } from '../../types';

const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 50;

// Mirror --color-chart-today / --color-chart-arrow in src/index.css
const CHART_COLORS = {
  light: { today: 'rgba(99, 102, 241, 0.12)', arrow: '#94A3B8' },
  dark: { today: 'rgba(129, 140, 248, 0.2)', arrow: '#64748b' },
} as const;

interface GanttViewProps {
  project: Project;
  onEditTask: (task: AppTask) => void;
  onAddTask: () => void;
}

export interface GanttViewHandle {
  jumpToToday: () => void;
}

export const GanttView = forwardRef<GanttViewHandle, GanttViewProps>(function GanttView(
  { project, onEditTask, onAddTask },
  ref
) {
  const tasks = useAppStore(s => s.tasks);
  const viewMode = useAppStore(s => s.viewMode);
  const theme = useAppStore(s => s.theme);
  const collapsedGroupIds = useAppStore(s => s.collapsedGroupIds);
  const updateTask = useAppStore(s => s.updateTask);
  const deleteTask = useAppStore(s => s.deleteTask);
  const restoreTask = useAppStore(s => s.restoreTask);
  const toggleGroupCollapsed = useAppStore(s => s.toggleGroupCollapsed);
  const pushToast = useToastStore(s => s.push);

  const collapsedSet = useMemo(() => new Set(collapsedGroupIds), [collapsedGroupIds]);

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chartColors = CHART_COLORS[useResolvedTheme(theme)];

  useImperativeHandle(ref, () => ({
    jumpToToday() {
      const wrapper = scrollRef.current;
      if (!wrapper) return;
      const todayRect = wrapper.querySelector<SVGRectElement>('.today rect');
      if (!todayRect || !todayRect.getAttribute('width')) {
        pushToast({ message: 'Today is outside the current task range.' });
        return;
      }
      const x = parseFloat(todayRect.getAttribute('x') ?? '0');
      const width = parseFloat(todayRect.getAttribute('width') ?? '0');
      const targetCenter = x + width / 2;

      // The library's horizontal scroll lives on its inner ganttVerticalContainer
      // (a sibling div wrapping the chart SVG) which has dir="ltr" and
      // overflow:hidden. Walking up from the today rect finds it.
      let scroller: HTMLElement | null = todayRect.closest<HTMLElement>('div[dir="ltr"]');
      if (!scroller) scroller = wrapper;
      const target = Math.max(0, targetCenter - scroller.clientWidth / 2);
      scroller.scrollTo({ left: target, behavior: 'smooth' });
    },
  }));

  const projectTasks = useMemo(
    () =>
      tasks
        .filter(t => t.projectId === project.id)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [tasks, project.id]
  );

  const libTasks = useMemo(
    () => toLibTasks(projectTasks, project, collapsedSet),
    [projectTasks, project, collapsedSet]
  );

  const visibleRowCount = useMemo(
    () =>
      projectTasks.filter(t => {
        if (t.type === 'group') return true;
        return !(t.parentId && collapsedSet.has(t.parentId));
      }).length,
    [projectTasks, collapsedSet]
  );

  if (projectTasks.length === 0) {
    return <EmptyState variant="no-tasks" onAction={onAddTask} />;
  }

  const libViewMode = viewModeMap[viewMode];
  const colWidth = columnWidthFor[viewMode];
  const chartHeight = Math.max(300, visibleRowCount * ROW_HEIGHT + HEADER_HEIGHT);

  function handleDateChange(task: LibTask) {
    updateTask(task.id, {
      start: toISODate(task.start),
      end: toISODate(task.end),
    });
  }

  function handleProgressChange(task: LibTask) {
    updateTask(task.id, { progress: Math.round(task.progress) });
  }

  function handleDoubleClick(task: LibTask) {
    const appTask = projectTasks.find(t => t.id === task.id);
    if (appTask) onEditTask(appTask);
  }

  // Return false to keep the bar in the library's internal state until we confirm
  function handleDelete(task: LibTask): boolean {
    setConfirmDelete({ id: task.id, name: task.name });
    return false;
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto gantt-overrides">
      <Gantt
        tasks={libTasks}
        viewMode={libViewMode}
        columnWidth={colWidth}
        listCellWidth="220px"
        rowHeight={ROW_HEIGHT}
        headerHeight={HEADER_HEIGHT}
        ganttHeight={chartHeight}
        barCornerRadius={6}
        barFill={60}
        fontSize="13px"
        todayColor={chartColors.today}
        arrowColor={chartColors.arrow}
        onDateChange={handleDateChange}
        onProgressChange={handleProgressChange}
        onDoubleClick={handleDoubleClick}
        onDelete={handleDelete}
        onExpanderClick={(task) => toggleGroupCollapsed(task.id)}
        TooltipContent={GanttTooltip}
      />

      {confirmDelete && (() => {
        const dependents = projectTasks.filter(t =>
          t.dependencies.includes(confirmDelete.id)
        );
        return (
          <ConfirmDialog
            title="Delete task"
            description={`"${confirmDelete.name}" will be permanently deleted.`}
            body={<DependentsPreview dependents={dependents} />}
            onConfirm={() => {
              const target = projectTasks.find(t => t.id === confirmDelete.id);
              if (!target) {
                setConfirmDelete(null);
                return;
              }
              const snapshotDependents = dependents.map(t => ({
                id: t.id,
                dependencies: [...t.dependencies],
              }));
              deleteTask(confirmDelete.id);
              setConfirmDelete(null);
              pushToast({
                message: `Deleted "${confirmDelete.name}"`,
                action: {
                  label: 'Undo',
                  run: () => restoreTask(target, snapshotDependents),
                },
              });
            }}
            onCancel={() => setConfirmDelete(null)}
          />
        );
      })()}
    </div>
  );
});

