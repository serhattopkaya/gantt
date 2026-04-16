import { Sparkles, X } from 'lucide-react';
import { useAppStore, selectIsSeeded } from '../../store/useAppStore';
import { Button } from './Button';

export function SampleDataBanner() {
  const isSeeded = useAppStore(selectIsSeeded);
  const seedDismissed = useAppStore(s => s.seedDismissed);
  const dismissSeed = useAppStore(s => s.dismissSeed);
  const clearSeedData = useAppStore(s => s.clearSeedData);

  if (!isSeeded || seedDismissed) return null;

  return (
    <div
      role="region"
      aria-label="Sample data"
      className="mx-6 mt-3 flex items-center gap-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2.5"
    >
      <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
      <p className="flex-1 text-sm text-indigo-900 dark:text-indigo-200">
        You're viewing sample data. Create a project to start fresh.
      </p>
      <Button size="sm" variant="secondary" onClick={clearSeedData}>
        Clear sample data
      </Button>
      <button
        onClick={dismissSeed}
        className="w-7 h-7 flex items-center justify-center rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
        aria-label="Dismiss sample data banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
