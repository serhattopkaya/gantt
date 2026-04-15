import 'gantt-task-react/dist/index.css';
import { useMemo, useState } from 'react';
import { Gantt } from 'gantt-task-react';
import type { Task as LibTask } from 'gantt-task-react';
import { useAppStore } from '../../store/useAppStore';
import { toLibTasks, viewModeMap, columnWidthFor } from '../../lib/ganttAdapter';
import { toISODate } from '../../lib/dates';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { GanttTooltip } from './GanttTooltip';
import type { AppTask, Project } from '../../types';

const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 50;

interface GanttViewProps {
  project: Project;
  onEditTask: (task: AppTask) => void;
  onAddTask: () => void;
}

export function GanttView({ project, onEditTask, onAddTask }: GanttViewProps) {
  const tasks = useAppStore(s => s.tasks);
  const viewMode = useAppStore(s => s.viewMode);
  const updateTask = useAppStore(s => s.updateTask);
  const deleteTask = useAppStore(s => s.deleteTask);

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const projectTasks = useMemo(
    () =>
      tasks
        .filter(t => t.projectId === project.id)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [tasks, project.id]
  );

  const libTasks = useMemo(
    () => toLibTasks(projectTasks, project),
    [projectTasks, project]
  );

  if (projectTasks.length === 0) {
    return <EmptyState variant="no-tasks" onAction={onAddTask} />;
  }

  const libViewMode = viewModeMap[viewMode];
  const colWidth = columnWidthFor[viewMode];
  const chartHeight = Math.max(300, projectTasks.length * ROW_HEIGHT + HEADER_HEIGHT);

  function handleDateChange(task: LibTask) {
    updateTask(task.id, {
      start: toISODate(task.start),
      end: toISODate(task.end),
    });
  }

  function handleProgressChange(task: LibTask) {
    updateTask(task.id, {
      progress: Math.max(0, Math.min(100, Math.round(task.progress))),
    });
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
    <div className="flex-1 overflow-auto">
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
        todayColor="rgba(99, 102, 241, 0.08)"
        arrowColor="#94A3B8"
        onDateChange={handleDateChange}
        onProgressChange={handleProgressChange}
        onDoubleClick={handleDoubleClick}
        onDelete={handleDelete}
        TooltipContent={GanttTooltip}
      />

      {confirmDelete && (
        <ConfirmDialog
          title="Delete task"
          description={`"${confirmDelete.name}" will be permanently deleted and removed from any dependencies.`}
          onConfirm={() => {
            deleteTask(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
