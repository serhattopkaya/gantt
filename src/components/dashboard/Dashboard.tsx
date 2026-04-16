import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeOverallMetrics } from '../../lib/metrics';
import { FolderOpen, ListTodo, CheckCircle2, Flag, AlertTriangle, TrendingUp, MessageSquareText } from 'lucide-react';
import { formatDisplay } from '../../lib/dates';
import { EmptyState } from '../common/EmptyState';
import type { AppTask, Project, ProjectNote } from '../../types';

interface DashboardProps {
  onOpenProject: (projectId: string) => void;
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diffMs < min) return 'just now';
  if (diffMs < hr) return `${Math.floor(diffMs / min)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hr)}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Dashboard({ onOpenProject }: DashboardProps) {
  const projects = useAppStore(s => s.projects);
  const tasks = useAppStore(s => s.tasks);
  const notes = useAppStore(s => s.notes);

  const metrics = useMemo(
    () => computeOverallMetrics(projects, tasks, 14),
    [projects, tasks]
  );

  const latestNoteByProject = useMemo(() => {
    const map = new Map<string, ProjectNote>();
    for (const note of notes) {
      const existing = map.get(note.projectId);
      if (!existing || note.createdAt > existing.createdAt) {
        map.set(note.projectId, note);
      }
    }
    return map;
  }, [notes]);

  if (projects.length === 0) {
    return <EmptyState variant="no-project" />;
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-surface-alt">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-text-primary mb-6">Overview</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<FolderOpen size={18} />}
            label="Projects"
            value={metrics.totalProjects}
          />
          <StatCard
            icon={<ListTodo size={18} />}
            label="Total tasks"
            value={metrics.totalTasks}
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="Completed"
            value={metrics.completedTasks}
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Avg progress"
            value={`${metrics.avgProgress}%`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Panel
            icon={<Flag size={16} className="text-indigo-600 dark:text-indigo-400" />}
            title="Milestones in next 14 days"
            count={metrics.upcomingMilestones.length}
            empty="No upcoming milestones."
          >
            {metrics.upcomingMilestones.slice(0, 8).map(({ project, task }) => (
              <TaskRow
                key={task.id}
                task={task}
                project={project}
                accentDate={`${formatDisplay(task.start)}`}
                onClick={() => onOpenProject(project.id)}
              />
            ))}
          </Panel>

          <Panel
            icon={<AlertTriangle size={16} className="text-red-600 dark:text-red-400" />}
            title="Overdue"
            count={metrics.overdueTasks.length}
            empty="Nothing overdue. "
          >
            {metrics.overdueTasks.slice(0, 8).map(({ project, task }) => (
              <TaskRow
                key={task.id}
                task={task}
                project={project}
                accentDate={`Due ${formatDisplay(task.type === 'milestone' ? task.start : task.end)}`}
                danger
                onClick={() => onOpenProject(project.id)}
              />
            ))}
          </Panel>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">By project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map(p => {
              const m = metrics.perProject.get(p.id);
              if (!m) return null;
              const latestNote = latestNoteByProject.get(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  className="text-left p-4 rounded-xl bg-surface border border-border hover:border-border-strong hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="font-medium text-text-primary truncate">{p.name}</span>
                  </div>
                  <div className="text-xs text-text-secondary mb-2">
                    {m.completedTasks} of {m.totalTasks} complete
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${m.avgProgress}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-text-muted">
                    <span>{m.avgProgress}%</span>
                    {m.overdueTasks.length > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        {m.overdueTasks.length} overdue
                      </span>
                    )}
                  </div>
                  {latestNote && (
                    <div className="mt-3 pt-3 border-t border-border flex items-start gap-2">
                      <MessageSquareText size={12} className="text-text-muted mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-secondary line-clamp-2 break-words">
                          {latestNote.body}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {formatRelativeTime(latestNote.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border">
      <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function Panel({
  icon,
  title,
  count,
  empty,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-surface border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        {icon}
        <h3 className="text-sm font-semibold text-text-primary flex-1">{title}</h3>
        <span className="text-xs text-text-muted tabular-nums">{count}</span>
      </div>
      <div className="divide-y divide-border">
        {count === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted text-center">{empty}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  project,
  accentDate,
  danger,
  onClick,
}: {
  task: AppTask;
  project: Project;
  accentDate: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-muted transition-colors"
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-text-primary truncate">{task.name}</div>
        <div className="text-xs text-text-muted truncate">{project.name}</div>
      </div>
      <span className={`text-xs tabular-nums ${danger ? 'text-red-600 dark:text-red-400' : 'text-text-muted'}`}>
        {accentDate}
      </span>
    </button>
  );
}
