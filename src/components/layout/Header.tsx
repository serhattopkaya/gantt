import { Plus, Flag, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import type { ViewModeKey } from '../../types';

interface HeaderProps {
  onAddTask: () => void;
  onAddMilestone: () => void;
  onEditProject: () => void;
}

const VIEW_MODES: ViewModeKey[] = ['Day', 'Week', 'Month'];

export function Header({ onAddTask, onAddMilestone, onEditProject }: HeaderProps) {
  const projects = useAppStore(s => s.projects);
  const currentProjectId = useAppStore(s => s.currentProjectId);
  const viewMode = useAppStore(s => s.viewMode);
  const setViewMode = useAppStore(s => s.setViewMode);

  const currentProject = projects.find(p => p.id === currentProjectId);

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-slate-200 gap-4">
      {/* Left: Project name */}
      <div className="flex items-center gap-2.5 min-w-0">
        {currentProject ? (
          <>
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentProject.color }}
            />
            <h1 className="text-base font-semibold text-slate-900 truncate">
              {currentProject.name}
            </h1>
            <button
              onClick={onEditProject}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
              aria-label="Edit project"
              title="Edit project"
            >
              <Settings size={15} />
            </button>
          </>
        ) : (
          <span className="text-base font-semibold text-slate-400">Select a project</span>
        )}
      </div>

      {/* Right: View mode + actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* View mode segmented control */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-0.5">
          {VIEW_MODES.map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${
                viewMode === mode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {currentProject && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onAddMilestone}
              disabled={!currentProjectId}
            >
              <Flag size={14} />
              Milestone
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAddTask}
              disabled={!currentProjectId}
            >
              <Plus size={14} />
              Task
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
