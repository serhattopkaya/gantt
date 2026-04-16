import type { ReactNode } from 'react';
import { FolderOpen, ListTodo, PartyPopper, Workflow } from 'lucide-react';
import { Button } from './Button';

type EmptyStateVariant = 'no-project' | 'no-tasks' | 'all-done' | 'no-dependencies';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  onAction?: () => void;
  actionLabel?: string;
  description?: ReactNode;
}

const CONFIG: Record<EmptyStateVariant, {
  icon: (props: { size: number; className?: string }) => ReactNode;
  title: string;
  description: string;
  defaultActionLabel: string;
}> = {
  'no-project': {
    icon: (p) => <FolderOpen {...p} />,
    title: 'No project selected',
    description: 'Create a new project or select one from the sidebar to get started.',
    defaultActionLabel: 'Create project',
  },
  'no-tasks': {
    icon: (p) => <ListTodo {...p} />,
    title: 'No tasks yet',
    description: 'Add your first task or milestone to see it on the Gantt chart.',
    defaultActionLabel: 'Add first task',
  },
  'all-done': {
    icon: (p) => <PartyPopper {...p} />,
    title: 'All tasks complete!',
    description: 'Every task in this project is at 100%. Time to celebrate or plan the next phase.',
    defaultActionLabel: 'Add another task',
  },
  'no-dependencies': {
    icon: (p) => <Workflow {...p} />,
    title: 'No dependencies yet',
    description: 'Link tasks together from the task modal to visualize the dependency graph.',
    defaultActionLabel: 'Add a dependency',
  },
};

export function EmptyState({ variant, onAction, actionLabel, description }: EmptyStateProps) {
  const cfg = CONFIG[variant];

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center mb-5">
        {cfg.icon({ size: 32, className: 'text-text-muted' })}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{cfg.title}</h3>
      <p className="text-sm text-text-secondary max-w-xs mb-6">
        {description ?? cfg.description}
      </p>
      {onAction && (
        <Button onClick={onAction}>
          {actionLabel ?? cfg.defaultActionLabel}
        </Button>
      )}
    </div>
  );
}
