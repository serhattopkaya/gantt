import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useToastStore, type Toast } from '../../store/useToastStore';

export function Toaster() {
  const toasts = useToastStore(s => s.toasts);
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore(s => s.dismiss);

  useEffect(() => {
    const handle = setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => clearTimeout(handle);
  }, [toast.id, toast.durationMs, dismiss]);

  return (
    <div
      role="status"
      className="pointer-events-auto min-w-[280px] max-w-sm bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-lg flex items-center gap-2 pl-4 pr-2 py-2.5 border border-slate-700"
    >
      <span className="text-sm flex-1 truncate">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.run();
            dismiss(toast.id);
          }}
          className="h-7 px-3 rounded-lg text-xs font-semibold text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
