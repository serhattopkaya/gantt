import { FolderOpen, ListTodo } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  variant: 'no-project' | 'no-tasks';
  onAction?: () => void;
}

export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const isNoProject = variant === 'no-project';

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        {isNoProject
          ? <FolderOpen size={32} className="text-slate-400" />
          : <ListTodo size={32} className="text-slate-400" />
        }
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        {isNoProject ? 'No project selected' : 'No tasks yet'}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        {isNoProject
          ? 'Create a new project or select one from the sidebar to get started.'
          : 'Add your first task or milestone to see it on the Gantt chart.'}
      </p>
      {onAction && (
        <Button onClick={onAction}>
          {isNoProject ? 'Create project' : 'Add first task'}
        </Button>
      )}
    </div>
  );
}
