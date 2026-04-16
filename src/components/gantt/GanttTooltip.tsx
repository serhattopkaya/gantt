import type { Task } from 'gantt-task-react';
import { toISODate, formatDisplay } from '../../lib/dates';

interface GanttTooltipProps {
  task: Task;
  fontSize: string;
  fontFamily: string;
}

export function GanttTooltip({ task }: GanttTooltipProps) {
  const startISO = toISODate(task.start);
  const endISO = toISODate(task.end);
  const isMilestone = task.type === 'milestone';

  return (
    <div className="bg-surface border border-border rounded-xl shadow-xl p-3 min-w-[200px] max-w-[260px]">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
          isMilestone
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
        }`}>
          {isMilestone ? 'Milestone' : 'Task'}
        </span>
      </div>
      <p className="text-sm font-semibold text-text-primary mb-2 leading-tight">{task.name}</p>
      <div className="space-y-1 text-xs text-text-muted">
        {isMilestone ? (
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-medium text-text-primary">{formatDisplay(startISO)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <span>Start</span>
              <span className="font-medium text-text-primary">{formatDisplay(startISO)}</span>
            </div>
            <div className="flex justify-between">
              <span>End</span>
              <span className="font-medium text-text-primary">{formatDisplay(endISO)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex justify-between mb-1">
                <span>Progress</span>
                <span className="font-semibold text-text-primary">{Math.round(task.progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, task.progress))}%`,
                    backgroundColor: task.styles?.progressColor ?? '#6366F1',
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
