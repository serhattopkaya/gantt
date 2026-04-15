import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import { MultiSelect } from '../common/MultiSelect';
import { useAppStore } from '../../store/useAppStore';
import { todayISO } from '../../lib/dates';
import type { AppTask, AppTaskType } from '../../types';

interface TaskModalProps {
  mode: 'create' | 'edit';
  initial?: AppTask;
  projectId: string;
  defaultType?: AppTaskType;
  onClose: () => void;
}

export function TaskModal({ mode, initial, projectId, defaultType = 'task', onClose }: TaskModalProps) {
  const tasks = useAppStore(s => s.tasks);
  const addTask = useAppStore(s => s.addTask);
  const updateTask = useAppStore(s => s.updateTask);
  const deleteTask = useAppStore(s => s.deleteTask);

  const today = todayISO();
  const [type, setType] = useState<AppTaskType>(initial?.type ?? defaultType);
  const [name, setName] = useState(initial?.name ?? '');
  const [start, setStart] = useState(initial?.start ?? today);
  const [end, setEnd] = useState(initial?.end ?? today);
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [dependencies, setDependencies] = useState<string[]>(initial?.dependencies ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const projectTasks = tasks.filter(
    t => t.projectId === projectId && t.id !== initial?.id
  );
  const depOptions = projectTasks.map(t => ({ value: t.id, label: t.name }));

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (type === 'task' && end < start) newErrors.end = 'End date must be on or after start date';
    if (progress < 0 || progress > 100) newErrors.progress = 'Progress must be 0–100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      projectId,
      type,
      name: name.trim(),
      start,
      end: type === 'milestone' ? start : end,
      progress: type === 'milestone' ? 0 : progress,
      dependencies,
    };

    if (mode === 'create') {
      addTask(payload);
    } else if (initial) {
      updateTask(initial.id, payload);
    }
    onClose();
  }

  function handleDelete() {
    if (initial) {
      deleteTask(initial.id);
      onClose();
    }
  }

  const isMilestone = type === 'milestone';

  return (
    <Modal title={mode === 'create' ? (isMilestone ? 'New milestone' : 'New task') : 'Edit'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
          <div className="flex gap-2">
            {(['task', 'milestone'] as AppTaskType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                  type === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
            placeholder={isMilestone ? 'e.g. Product Launch' : 'e.g. Design mockups'}
            autoFocus
            className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Dates */}
        <div className={`grid gap-3 ${isMilestone ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {isMilestone ? 'Date' : 'Start date'}
            </label>
            <input
              type="date"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {!isMilestone && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End date</label>
              <input
                type="date"
                value={end}
                min={start}
                onChange={e => { setEnd(e.target.value); setErrors(prev => ({ ...prev, end: '' })); }}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.end && <p className="text-xs text-red-500 mt-1">{errors.end}</p>}
            </div>
          )}
        </div>

        {/* Progress */}
        {!isMilestone && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Progress</label>
              <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            {errors.progress && <p className="text-xs text-red-500 mt-1">{errors.progress}</p>}
          </div>
        )}

        {/* Dependencies */}
        {projectTasks.length > 0 && (
          <MultiSelect
            label="Dependencies"
            options={depOptions}
            value={dependencies}
            onChange={setDependencies}
            placeholder="Select predecessor tasks…"
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {mode === 'edit' && (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">
              {mode === 'create' ? (isMilestone ? 'Add milestone' : 'Add task') : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
