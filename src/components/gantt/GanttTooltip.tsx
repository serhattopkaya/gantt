import type { Task } from 'gantt-task-react';
import { formatDisplay } from '../../lib/dates';

interface GanttTooltipProps {
  task: Task;
  fontSize: string;
  fontFamily: string;
}

export function GanttTooltip({ task }: GanttTooltipProps) {
  const startISO = task.start.toISOString().slice(0, 10);
  const endISO = task.end.toISOString().slice(0, 10);
  const isMilestone = task.type === 'milestone';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[200px] max-w-[260px]">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
          isMilestone
            ? 'bg-amber-100 text-amber-700'
            : 'bg-indigo-100 text-indigo-700'
        }`}>
          {isMilestone ? 'Milestone' : 'Task'}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-900 mb-2 leading-tight">{task.name}</p>
      <div className="space-y-1 text-xs text-slate-500">
        {isMilestone ? (
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-medium text-slate-700">{formatDisplay(startISO)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <span>Start</span>
              <span className="font-medium text-slate-700">{formatDisplay(startISO)}</span>
            </div>
            <div className="flex justify-between">
              <span>End</span>
              <span className="font-medium text-slate-700">{formatDisplay(endISO)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between mb-1">
                <span>Progress</span>
                <span className="font-semibold text-slate-700">{Math.round(task.progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${task.progress}%`,
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
