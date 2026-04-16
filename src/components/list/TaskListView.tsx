import { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Flag, Search, CheckSquare, Square } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';
import { formatDisplay } from '../../lib/dates';
import type { AppTask, Project } from '../../types';

type SortKey = 'name' | 'type' | 'start' | 'end' | 'progress';
type SortDir = 'asc' | 'desc';

interface TaskListViewProps {
  project: Project;
  onEditTask: (task: AppTask) => void;
  onAddTask: () => void;
}

export function TaskListView({ project, onEditTask, onAddTask }: TaskListViewProps) {
  const tasks = useAppStore(s => s.tasks);
  const updateTask = useAppStore(s => s.updateTask);
  const bulkSetProgress = useAppStore(s => s.bulkSetProgress);
  const bulkShiftTasks = useAppStore(s => s.bulkShiftTasks);
  const bulkDeleteTasks = useAppStore(s => s.bulkDeleteTasks);
  const bulkRestoreTasks = useAppStore(s => s.bulkRestoreTasks);
  const pushToast = useToastStore(s => s.push);

  const [sortKey, setSortKey] = useState<SortKey>('start');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string; field: 'name' | 'progress' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);

  const projectTasks = useMemo(
    () => tasks.filter(t => t.projectId === project.id),
    [tasks, project.id]
  );

  const nameLookup = useMemo(
    () => new Map(projectTasks.map(t => [t.id, t.name])),
    [projectTasks]
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const base = q ? projectTasks.filter(t => t.name.toLowerCase().includes(q)) : projectTasks;
    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
        case 'start': cmp = a.start.localeCompare(b.start); break;
        case 'end': cmp = a.end.localeCompare(b.end); break;
        case 'progress': cmp = a.progress - b.progress; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [projectTasks, filter, sortKey, sortDir]);

  const visibleIds = useMemo(() => new Set(filtered.map(t => t.id)), [filtered]);
  const selectedVisible = useMemo(
    () => Array.from(selectedIds).filter(id => visibleIds.has(id)),
    [selectedIds, visibleIds]
  );
  const allVisibleSelected = filtered.length > 0 && filtered.every(t => selectedIds.has(t.id));

  if (projectTasks.length === 0) {
    return <EmptyState variant="no-tasks" onAction={onAddTask} />;
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (const t of filtered) next.delete(t.id);
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (const t of filtered) next.add(t.id);
        return next;
      });
    }
  }

  function toggleRow(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startEdit(id: string, field: 'name' | 'progress', current: string | number) {
    setEditing({ id, field });
    setEditValue(String(current));
  }

  function commitEdit() {
    if (!editing) return;
    const { id, field } = editing;
    if (field === 'name') {
      const v = editValue.trim();
      if (v) updateTask(id, { name: v });
    } else if (field === 'progress') {
      const n = Number(editValue);
      if (Number.isFinite(n)) {
        updateTask(id, { progress: Math.max(0, Math.min(100, Math.round(n))) });
      }
    }
    setEditing(null);
  }

  function cancelEdit() {
    setEditing(null);
  }

  function applyBulkProgress(val: number) {
    bulkSetProgress(selectedVisible, val);
  }

  function applyBulkShift(days: number) {
    bulkShiftTasks(selectedVisible, days);
  }

  function handleBulkDelete() {
    const snapshot = bulkDeleteTasks(selectedVisible);
    const count = snapshot.tasks.length;
    setSelectedIds(new Set());
    setConfirmingBulkDelete(false);
    pushToast({
      message: `Deleted ${count} ${count === 1 ? 'task' : 'tasks'}`,
      action: {
        label: 'Undo',
        run: () => bulkRestoreTasks(snapshot.tasks, snapshot.dependents),
      },
    });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border">
        <div className="flex items-center gap-2 bg-surface-muted rounded-lg px-2.5 h-8 flex-1 max-w-xs">
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter tasks…"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
        </div>
        {selectedVisible.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">{selectedVisible.length} selected</span>
            <Button size="sm" variant="secondary" onClick={() => applyBulkShift(1)}>+1 day</Button>
            <Button size="sm" variant="secondary" onClick={() => applyBulkShift(7)}>+1 week</Button>
            <Button size="sm" variant="secondary" onClick={() => applyBulkProgress(100)}>Mark done</Button>
            <Button size="sm" variant="danger" onClick={() => setConfirmingBulkDelete(true)}>Delete</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface-alt z-10">
            <tr className="text-left text-xs text-text-muted uppercase tracking-wider">
              <th className="px-3 py-2 w-10">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center justify-center w-5 h-5 text-text-muted hover:text-text-primary"
                  aria-label={allVisibleSelected ? 'Deselect all' : 'Select all'}
                >
                  {allVisibleSelected
                    ? <CheckSquare size={16} className="text-indigo-600" />
                    : <Square size={16} />
                  }
                </button>
              </th>
              <HeaderCell label="Name" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} />
              <HeaderCell label="Type" active={sortKey === 'type'} dir={sortDir} onClick={() => toggleSort('type')} />
              <HeaderCell label="Start" active={sortKey === 'start'} dir={sortDir} onClick={() => toggleSort('start')} />
              <HeaderCell label="End" active={sortKey === 'end'} dir={sortDir} onClick={() => toggleSort('end')} />
              <HeaderCell label="Progress" active={sortKey === 'progress'} dir={sortDir} onClick={() => toggleSort('progress')} />
              <th className="px-3 py-2">Dependencies</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const selected = selectedIds.has(t.id);
              return (
                <tr
                  key={t.id}
                  className={`border-b border-border ${selected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-surface-muted'}`}
                >
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => toggleRow(t.id)}
                      className="inline-flex items-center justify-center w-5 h-5 text-text-muted hover:text-text-primary"
                      aria-label={selected ? 'Deselect row' : 'Select row'}
                    >
                      {selected
                        ? <CheckSquare size={16} className="text-indigo-600" />
                        : <Square size={16} />
                      }
                    </button>
                  </td>
                  <td
                    className="px-3 py-2.5 text-text-primary cursor-text"
                    onDoubleClick={() => startEdit(t.id, 'name', t.name)}
                  >
                    {editing?.id === t.id && editing.field === 'name' ? (
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-full h-7 px-2 border border-indigo-500 rounded bg-surface text-text-primary focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => onEditTask(t)}
                        className="text-left hover:underline"
                      >
                        {t.name}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary">
                    {t.type === 'milestone' ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Flag size={12} />
                        Milestone
                      </span>
                    ) : (
                      <span className="text-xs">Task</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap text-xs tabular-nums">
                    {formatDisplay(t.start)}
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap text-xs tabular-nums">
                    {t.type === 'milestone' ? '—' : formatDisplay(t.end)}
                  </td>
                  <td
                    className="px-3 py-2.5 text-text-primary cursor-text"
                    onDoubleClick={() => t.type !== 'milestone' && startEdit(t.id, 'progress', t.progress)}
                  >
                    {editing?.id === t.id && editing.field === 'progress' ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={5}
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-16 h-7 px-2 border border-indigo-500 rounded text-xs tabular-nums bg-surface text-text-primary focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${t.progress}%`, backgroundColor: project.color }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary tabular-nums">{t.progress}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-text-secondary">
                    {t.dependencies.length === 0 ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span className="truncate inline-block max-w-[240px]">
                        {t.dependencies.map(id => nameLookup.get(id) ?? '?').join(', ')}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-text-muted">
                  No tasks match "{filter}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirmingBulkDelete && (
        <ConfirmDialog
          title={`Delete ${selectedVisible.length} ${selectedVisible.length === 1 ? 'task' : 'tasks'}`}
          description="This will remove the selected rows and their dependency edges."
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmingBulkDelete(false)}
        />
      )}
    </div>
  );
}

function HeaderCell({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-2">
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-text-primary transition-colors ${active ? 'text-text-primary' : ''}`}
      >
        {label}
        {active
          ? (dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
          : <ArrowUpDown size={12} className="opacity-40" />
        }
      </button>
    </th>
  );
}
