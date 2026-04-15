import 'gantt-task-react/dist/index.css';
import { useRef } from 'react';
import { Gantt } from 'gantt-task-react';
import type { Task as LibTask } from 'gantt-task-react';
import { useAppStore } from '../../store/useAppStore';
import { toLibTasks, viewModeMap, columnWidthFor } from '../../lib/ganttAdapter';
import { EmptyState } from '../common/EmptyState';
import { GanttTooltip } from './GanttTooltip';
import type { AppTask, Project } from '../../types';

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
  const containerRef = useRef<HTMLDivElement>(null);

  const projectTasks = tasks
    .filter(t => t.projectId === project.id)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (projectTasks.length === 0) {
    return <EmptyState variant="no-tasks" onAction={onAddTask} />;
  }

  const libTasks = toLibTasks(projectTasks, project);
  const libViewMode = viewModeMap[viewMode];
  const colWidth = columnWidthFor[viewMode];

  function handleDateChange(task: LibTask) {
    updateTask(task.id, {
      start: task.start.toISOString().slice(0, 10),
      end: task.end.toISOString().slice(0, 10),
    });
  }

  function handleProgressChange(task: LibTask) {
    updateTask(task.id, { progress: Math.round(task.progress) });
  }

  function handleDoubleClick(task: LibTask) {
    const appTask = projectTasks.find(t => t.id === task.id);
    if (appTask) onEditTask(appTask);
  }

  function handleDelete(task: LibTask): boolean {
    if (window.confirm(`Delete "${task.name}"?`)) {
      deleteTask(task.id);
      return true;
    }
    return false;
  }

  // Compute chart height based on container
  const rowHeight = 50;
  const headerHeight = 80;
  const chartHeight = Math.max(300, projectTasks.length * rowHeight + headerHeight);

  return (
    <div ref={containerRef} className="flex-1 overflow-auto">
      <Gantt
        tasks={libTasks}
        viewMode={libViewMode}
        columnWidth={colWidth}
        listCellWidth="220px"
        rowHeight={rowHeight}
        headerHeight={60}
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
    </div>
  );
}
