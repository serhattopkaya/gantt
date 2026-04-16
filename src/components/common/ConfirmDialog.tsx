import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../modals/Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  title: string;
  description?: string;
  body?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  body,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel}>
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {description && (
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          )}
          {body && <div className="mt-3 text-sm text-text-secondary">{body}</div>}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
