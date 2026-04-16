import type { AppTask } from '../../types';

interface DependentsPreviewProps {
  dependents: AppTask[];
  maxPreview?: number;
}

export function DependentsPreview({ dependents, maxPreview = 3 }: DependentsPreviewProps) {
  if (dependents.length === 0) {
    return <p className="text-text-muted">No other tasks depend on this.</p>;
  }
  const preview = dependents.slice(0, maxPreview);
  const remaining = dependents.length - preview.length;
  return (
    <div>
      <p className="font-medium text-text-primary">
        {dependents.length} {dependents.length === 1 ? 'task depends' : 'tasks depend'} on this:
      </p>
      <ul className="mt-1.5 list-disc list-inside text-text-secondary space-y-0.5">
        {preview.map(t => (
          <li key={t.id} className="truncate">{t.name}</li>
        ))}
        {remaining > 0 && (
          <li className="text-text-muted">…and {remaining} more</li>
        )}
      </ul>
      <p className="mt-2 text-xs text-text-muted">
        These tasks will have the dependency removed.
      </p>
    </div>
  );
}
