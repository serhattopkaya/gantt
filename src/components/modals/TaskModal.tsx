import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import { MultiSelect } from '../common/MultiSelect';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FieldError } from '../common/FieldError';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
import {
  todayISO,
  fromISODate,
  toISODate,
  addDays,
  workingDaysBetween,
  calendarDaysBetween,
  weekdayShort,
} from '../../lib/dates';
import { hasCycle } from '../../lib/dependencies';
import type { AppTask, AppTaskType } from '../../types';

interface TaskModalProps {
  mode: 'create' | 'edit';
  initial?: AppTask;
  projectId: string;
  defaultType?: AppTaskType;
  onClose: () => void;
}

function shiftISO(iso: string, days: number): string {
  return toISODate(addDays(fromISODate(iso), days));
}

const QUICK_SETS: Array<{ label: string; days: number }> = [
  { label: 'Today', days: 0 },
  { label: '+1 day', days: 1 },
  { label: '+1 week', days: 7 },
  { label: '+1 month', days: 30 },
];

export function TaskModal({ mode, initial, projectId, defaultType = 'task', onClose }: TaskModalProps) {
  const tasks = useAppStore(s => s.tasks);
  const addTask = useAppStore(s => s.addTask);
  const updateTask = useAppStore(s => s.updateTask);
  const deleteTask = useAppStore(s => s.deleteTask);
  const restoreTask = useAppStore(s => s.restoreTask);
  const pushToast = useToastStore(s => s.push);

  const today = todayISO();
  const [type, setType] = useState<AppTaskType>(initial?.type ?? defaultType);
  const [name, setName] = useState(initial?.name ?? '');
  const [start, setStart] = useState(initial?.start ?? today);
  const [end, setEnd] = useState(initial?.end ?? today);
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [dependencies, setDependencies] = useState<string[]>(initial?.dependencies ?? []);
  const [parentId, setParentId] = useState<string | undefined>(initial?.parentId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const uid = useId();
  const nameId = `${uid}-name`;
  const nameErrId = `${uid}-name-error`;
  const startId = `${uid}-start`;
  const startErrId = `${uid}-start-error`;
  const endId = `${uid}-end`;
  const endErrId = `${uid}-end-error`;
  const progressId = `${uid}-progress`;
  const depErrId = `${uid}-dep-error`;
  const parentSelectId = `${uid}-parent`;

  const projectTasks = tasks.filter(
    t => t.projectId === projectId && t.id !== initial?.id
  );
  const groupOptions = projectTasks.filter(t => t.type === 'group');
  // Don't allow groups to be chosen as predecessors — arrows from group bars
  // are confusing and their span is derived from children.
  const dependencyCandidates = projectTasks.filter(t => t.type !== 'group');
  const validDependencies = dependencies.filter(id =>
    dependencyCandidates.some(t => t.id === id)
  );
  const depOptions = dependencyCandidates.map(t => ({ value: t.id, label: t.name }));

  function handleTypeChange(newType: AppTaskType) {
    setType(newType);
    if (newType === 'milestone') {
      setEnd(start);
    } else if (end < start) {
      setEnd(start);
    }
    if (newType === 'group') {
      setParentId(undefined);
    }
    setErrors(prev => {
      const next = { ...prev };
      delete next.end;
      delete next.progress;
      return next;
    });
  }

  function applyStartQuick(days: number) {
    const next = shiftISO(today, days);
    setStart(next);
    if (type === 'milestone') setEnd(next);
    else if (end < next) setEnd(next);
    setErrors(prev => ({ ...prev, start: '', end: '' }));
  }

  function applyEndQuick(days: number) {
    const base = start || today;
    const next = shiftISO(base, days);
    setEnd(next);
    setErrors(prev => ({ ...prev, end: '' }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!start) newErrors.start = 'Date is required';
    if (type === 'task' || type === 'group') {
      if (!end) newErrors.end = 'End date is required';
      else if (end < start) newErrors.end = 'End date must be on or after start date';
    }
    if (validDependencies.length > 0) {
      const cyclePath = hasCycle(
        initial?.id ?? '__new__',
        validDependencies,
        tasks.filter(t => t.projectId === projectId),
        name.trim() || 'This task'
      );
      if (cyclePath) {
        newErrors.dependencies = `Circular dependency: ${cyclePath.join(' → ')}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      projectId,
      type,
      name: name.trim(),
      start,
      end: type === 'milestone' ? start : end,
      progress: type === 'milestone' || type === 'group' ? 0 : progress,
      dependencies: validDependencies,
      parentId: type === 'group' ? undefined : parentId,
    };

    if (mode === 'create') {
      addTask(payload);
    } else if (initial) {
      updateTask(initial.id, payload);
    }
    onClose();
  }

  function handleDelete() {
    if (!initial) return;
    const snapshotTask = initial;
    const snapshotDependents = tasks
      .filter(t => t.projectId === projectId && t.dependencies.includes(initial.id))
      .map(t => ({ id: t.id, dependencies: [...t.dependencies] }));
    deleteTask(initial.id);
    onClose();
    pushToast({
      message: `Deleted "${snapshotTask.name}"`,
      action: {
        label: 'Undo',
        run: () => restoreTask(snapshotTask, snapshotDependents),
      },
    });
  }

  const dependents = initial
    ? tasks.filter(t => t.projectId === projectId && t.dependencies.includes(initial.id))
    : [];

  const isMilestone = type === 'milestone';
  const isGroup = type === 'group';
  const hideEnd = isMilestone;
  const hideProgress = isMilestone || isGroup;
  const canShowDuration = !hideEnd && start && end && end >= start;
  const working = canShowDuration ? workingDaysBetween(start, end) : 0;
  const calendar = canShowDuration ? calendarDaysBetween(start, end) : 0;

  const progressNum = Number.isFinite(progress) ? progress : 0;

  const modalTitle =
    mode === 'create'
      ? (isMilestone ? 'New milestone' : isGroup ? 'New group' : 'New task')
      : 'Edit';
  const submitLabel =
    mode === 'create'
      ? (isMilestone ? 'Add milestone' : isGroup ? 'Add group' : 'Add task')
      : 'Save changes';

  return (
    <Modal title={modalTitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Type</label>
          <div className="flex gap-2" role="radiogroup" aria-label="Task type">
            {(['task', 'milestone', 'group'] as AppTaskType[]).map(t => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => handleTypeChange(t)}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                  type === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-surface-muted text-text-secondary hover:bg-border'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor={nameId} className="block text-sm font-medium text-text-primary mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
            placeholder={
              isMilestone ? 'e.g. Product Launch' : isGroup ? 'e.g. Phase 1 — Discovery' : 'e.g. Design mockups'
            }
            autoFocus
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? nameErrId : undefined}
            className="w-full h-10 px-3 border border-border-strong bg-surface text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <FieldError id={nameErrId} message={errors.name} />
        </div>

        <div className={`grid gap-3 transition-all duration-200 ${hideEnd ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label htmlFor={startId} className="block text-sm font-medium text-text-primary mb-1">
              {isMilestone ? 'Date' : 'Start date'}
            </label>
            <input
              id={startId}
              type="date"
              value={start}
              onChange={e => {
                const v = e.target.value;
                setStart(v);
                if (type === 'milestone') setEnd(v);
                else if (end < v) setEnd(v);
                setErrors(prev => ({ ...prev, start: '', end: '' }));
              }}
              aria-invalid={!!errors.start}
              aria-describedby={errors.start ? startErrId : undefined}
              className="w-full h-10 px-3 border border-border-strong bg-surface text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {QUICK_SETS.map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => applyStartQuick(q.days)}
                  className="h-6 px-2 rounded-md text-[11px] font-medium text-text-secondary bg-surface-muted hover:bg-border transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>
            <FieldError id={startErrId} message={errors.start} />
          </div>
          <div
            className="collapse-height"
            style={{
              maxHeight: hideEnd ? '0px' : '260px',
              opacity: hideEnd ? 0 : 1,
              pointerEvents: hideEnd ? 'none' : 'auto',
            }}
            aria-hidden={hideEnd}
          >
            <label htmlFor={endId} className="block text-sm font-medium text-text-primary mb-1">End date</label>
            <input
              id={endId}
              type="date"
              value={end}
              min={start}
              onChange={e => { setEnd(e.target.value); setErrors(prev => ({ ...prev, end: '' })); }}
              aria-invalid={!!errors.end}
              aria-describedby={errors.end ? endErrId : undefined}
              className="w-full h-10 px-3 border border-border-strong bg-surface text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {QUICK_SETS.slice(1).map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => applyEndQuick(q.days)}
                  className="h-6 px-2 rounded-md text-[11px] font-medium text-text-secondary bg-surface-muted hover:bg-border transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>
            <FieldError id={endErrId} message={errors.end} />
          </div>
        </div>

        {canShowDuration && (
          <p className="text-xs text-text-secondary -mt-2">
            {working} working {working === 1 ? 'day' : 'days'} · {calendar} calendar {calendar === 1 ? 'day' : 'days'} ({weekdayShort(start)} → {weekdayShort(end)})
          </p>
        )}

        <div
          className="collapse-height"
          style={{
            maxHeight: hideProgress ? '0px' : '120px',
            opacity: hideProgress ? 0 : 1,
            pointerEvents: hideProgress ? 'none' : 'auto',
          }}
          aria-hidden={hideProgress}
        >
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={progressId} className="text-sm font-medium text-text-primary">Progress</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={progressNum}
                onChange={e => {
                  const raw = e.target.value;
                  const n = raw === '' ? 0 : Number(raw);
                  if (!Number.isFinite(n)) return;
                  setProgress(Math.max(0, Math.min(100, Math.round(n))));
                }}
                className="w-16 h-7 px-2 border border-border-strong bg-surface text-text-primary rounded-md text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Progress percent"
              />
              <span className="text-xs text-text-muted">%</span>
            </div>
          </div>
          <input
            id={progressId}
            type="range"
            min={0}
            max={100}
            step={5}
            value={progressNum}
            onChange={e => setProgress(Number(e.target.value))}
            list={`${uid}-progress-ticks`}
            className="gantt-range w-full accent-indigo-600"
          />
          <datalist id={`${uid}-progress-ticks`}>
            <option value="0" label="0%" />
            <option value="25" label="25%" />
            <option value="50" label="50%" />
            <option value="75" label="75%" />
            <option value="100" label="100%" />
          </datalist>
          <div className="flex justify-between text-[10px] text-text-muted px-0.5 mt-1 select-none">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>

        {!isGroup && groupOptions.length > 0 && (
          <div>
            <label
              htmlFor={parentSelectId}
              className="block text-sm font-medium text-text-primary mb-1"
            >
              Group
            </label>
            <select
              id={parentSelectId}
              value={parentId ?? ''}
              onChange={e => setParentId(e.target.value || undefined)}
              className="w-full h-10 px-3 border border-border-strong bg-surface text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">No group</option>
              {groupOptions.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isGroup && depOptions.length > 0 && (
          <div>
            <MultiSelect
              label="Dependencies"
              options={depOptions}
              value={validDependencies}
              onChange={ids => {
                setDependencies(ids);
                setErrors(prev => ({ ...prev, dependencies: '' }));
              }}
              placeholder="Select predecessor tasks…"
            />
            <FieldError id={depErrId} message={errors.dependencies} />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div>
            {mode === 'edit' && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">{submitLabel}</Button>
          </div>
        </div>
      </form>
      {confirmingDelete && initial && (
        <ConfirmDialog
          title="Delete task"
          description={`"${initial.name}" will be permanently deleted.`}
          body={
            dependents.length === 0 ? (
              <p className="text-text-muted">No other tasks depend on this.</p>
            ) : (
              <div>
                <p className="font-medium text-text-primary">
                  {dependents.length} {dependents.length === 1 ? 'task depends' : 'tasks depend'} on this:
                </p>
                <ul className="mt-1.5 list-disc list-inside text-text-secondary space-y-0.5">
                  {dependents.slice(0, 3).map(t => (
                    <li key={t.id} className="truncate">{t.name}</li>
                  ))}
                  {dependents.length > 3 && (
                    <li className="text-text-muted">…and {dependents.length - 3} more</li>
                  )}
                </ul>
              </div>
            )
          }
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </Modal>
  );
}
