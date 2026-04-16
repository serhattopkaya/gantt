import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Flag,
  FolderTree,
  Settings,
  Calendar,
  Menu,
  Moon,
  Sun,
  MonitorCog,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  LayoutGrid,
  List as ListIcon,
  MessageSquareText,
  MoreVertical,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
import { Button } from '../common/Button';
import {
  buildExportBundle,
  downloadJSON,
  downloadProjectCSV,
  readJSONFile,
} from '../../lib/exportImport';
import { VIEW_MODES, type ThemeKey } from '../../types';

interface HeaderProps {
  onAddTask: () => void;
  onAddMilestone: () => void;
  onAddGroup: () => void;
  onEditProject: () => void;
  onJumpToToday: () => void;
  onOpenMobileSidebar: () => void;
}

export function Header({
  onAddTask,
  onAddMilestone,
  onAddGroup,
  onEditProject,
  onJumpToToday,
  onOpenMobileSidebar,
}: HeaderProps) {
  const projects = useAppStore(s => s.projects);
  const tasks = useAppStore(s => s.tasks);
  const notes = useAppStore(s => s.notes);
  const currentProjectId = useAppStore(s => s.currentProjectId);
  const viewMode = useAppStore(s => s.viewMode);
  const displayMode = useAppStore(s => s.displayMode);
  const view = useAppStore(s => s.view);
  const theme = useAppStore(s => s.theme);
  const setViewMode = useAppStore(s => s.setViewMode);
  const setDisplayMode = useAppStore(s => s.setDisplayMode);
  const setTheme = useAppStore(s => s.setTheme);
  const replaceAll = useAppStore(s => s.replaceAll);
  const pushToast = useToastStore(s => s.push);

  const currentProject = projects.find(p => p.id === currentProjectId);
  const isDashboard = view === 'dashboard';

  const [dataOpen, setDataOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const dataRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dataOpen && !themeOpen) return;
    function handleClick(e: MouseEvent) {
      if (dataRef.current && !dataRef.current.contains(e.target as Node)) setDataOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dataOpen, themeOpen]);

  function handleExportJSON() {
    const bundle = buildExportBundle({
      projects,
      tasks,
      notes,
      currentProjectId,
      viewMode,
    });
    downloadJSON(bundle);
    setDataOpen(false);
    pushToast({ message: 'Exported data to JSON.' });
  }

  function handleExportCSV() {
    if (!currentProject) return;
    downloadProjectCSV(currentProject, tasks);
    setDataOpen(false);
    pushToast({ message: `Exported ${currentProject.name} tasks to CSV.` });
  }

  function handleImportClick() {
    setDataOpen(false);
    fileInputRef.current?.click();
  }

  async function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = await readJSONFile(file);
      if (!window.confirm(`Import will replace your current data with ${data.projects.length} project(s) and ${data.tasks.length} task(s). Continue?`)) {
        return;
      }
      replaceAll({
        projects: data.projects,
        tasks: data.tasks,
        notes: data.notes ?? [],
        currentProjectId: data.currentProjectId,
        viewMode: data.viewMode,
      });
      pushToast({ message: 'Imported data successfully.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed.';
      pushToast({ message: `Import failed: ${message}` });
    }
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : MonitorCog;

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-surface border-b border-border gap-3">
      {/* Left: Mobile menu + project name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={onOpenMobileSidebar}
          className="flex md:hidden w-8 h-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        {isDashboard ? (
          <h1 className="text-base font-semibold text-text-primary truncate">Overview</h1>
        ) : currentProject ? (
          <>
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentProject.color }}
              aria-hidden="true"
            />
            <h1 className="text-base font-semibold text-text-primary truncate">
              {currentProject.name}
            </h1>
            <button
              onClick={onEditProject}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors flex-shrink-0"
              aria-label="Edit project"
              title="Edit project"
            >
              <Settings size={15} />
            </button>
          </>
        ) : (
          <span className="text-base font-semibold text-text-muted">Select a project</span>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Display mode toggle */}
        {!isDashboard && currentProject && (
          <div className="hidden sm:flex items-center bg-surface-muted rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setDisplayMode('gantt')}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                displayMode === 'gantt'
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={displayMode === 'gantt'}
            >
              <LayoutGrid size={13} />
              Timeline
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                displayMode === 'list'
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={displayMode === 'list'}
            >
              <ListIcon size={13} />
              List
            </button>
            <button
              onClick={() => setDisplayMode('notes')}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                displayMode === 'notes'
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={displayMode === 'notes'}
            >
              <MessageSquareText size={13} />
              Notes
            </button>
          </div>
        )}

        {/* View mode segmented control — only in timeline mode */}
        {!isDashboard && currentProject && displayMode === 'gantt' && (
          <div className="hidden lg:flex items-center bg-surface-muted rounded-lg p-1 gap-0.5">
            {VIEW_MODES.map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                aria-pressed={viewMode === mode}
              >
                {mode}
              </button>
            ))}
          </div>
        )}

        {!isDashboard && currentProject && displayMode === 'gantt' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onJumpToToday}
            disabled={!currentProjectId}
            title="Scroll to today"
            className="hidden sm:inline-flex"
          >
            <Calendar size={14} />
            Today
          </Button>
        )}

        {!isDashboard && currentProject && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onAddGroup}
              disabled={!currentProjectId}
              className="hidden md:inline-flex"
              title="Add a phase or workpackage that contains tasks"
            >
              <FolderTree size={14} />
              Group
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onAddMilestone}
              disabled={!currentProjectId}
              className="hidden sm:inline-flex"
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
              <span className="hidden sm:inline">Task</span>
            </Button>
          </>
        )}

        {/* Theme toggle */}
        <div ref={themeRef} className="relative">
          <button
            onClick={() => setThemeOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
            aria-label="Theme"
            aria-haspopup="menu"
            aria-expanded={themeOpen}
            title="Theme"
          >
            <ThemeIcon size={16} />
          </button>
          {themeOpen && (
            <div role="menu" className="absolute right-0 top-full mt-1 w-32 bg-surface border border-border rounded-xl shadow-lg z-40 overflow-hidden">
              {([
                ['light', Sun, 'Light'],
                ['dark', Moon, 'Dark'],
                ['system', MonitorCog, 'System'],
              ] as Array<[ThemeKey, typeof Sun, string]>).map(([key, Icon, label]) => (
                <button
                  key={key}
                  role="menuitem"
                  onClick={() => { setTheme(key); setThemeOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-muted transition-colors ${theme === key ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-text-primary'}`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data menu */}
        <div ref={dataRef} className="relative">
          <button
            onClick={() => setDataOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
            aria-label="Data menu"
            aria-haspopup="menu"
            aria-expanded={dataOpen}
            title="Data"
          >
            <MoreVertical size={16} />
          </button>
          {dataOpen && (
            <div role="menu" className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg z-40 overflow-hidden">
              <button
                role="menuitem"
                onClick={handleExportJSON}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted transition-colors"
              >
                <Download size={14} />
                <FileJson size={13} />
                Export JSON
              </button>
              {currentProject && (
                <button
                  role="menuitem"
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted transition-colors"
                >
                  <Download size={14} />
                  <FileSpreadsheet size={13} />
                  Export CSV
                </button>
              )}
              <button
                role="menuitem"
                onClick={handleImportClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted transition-colors"
              >
                <Upload size={14} />
                <FileJson size={13} />
                Import JSON
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleFilePicked}
        />
      </div>
    </header>
  );
}
