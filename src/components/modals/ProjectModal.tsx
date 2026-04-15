import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import { ColorSwatch } from '../common/ColorSwatch';
import { PROJECT_COLORS, defaultColor } from '../../lib/colors';
import { useAppStore } from '../../store/useAppStore';
import type { Project } from '../../types';

interface ProjectModalProps {
  mode: 'create' | 'edit';
  initial?: Project;
  onClose: () => void;
}

export function ProjectModal({ mode, initial, onClose }: ProjectModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? defaultColor());
  const [error, setError] = useState('');

  const addProject = useAppStore(s => s.addProject);
  const updateProject = useAppStore(s => s.updateProject);
  const setCurrentProject = useAppStore(s => s.setCurrentProject);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (mode === 'create') {
      const project = addProject({ name: name.trim(), color });
      setCurrentProject(project.id);
    } else if (initial) {
      updateProject(initial.id, { name: name.trim(), color });
    }
    onClose();
  }

  return (
    <Modal title={mode === 'create' ? 'New project' : 'Edit project'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Project name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Website Redesign"
            autoFocus
            className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map(c => (
              <ColorSwatch
                key={c}
                color={c}
                selected={color === c}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{mode === 'create' ? 'Create project' : 'Save changes'}</Button>
        </div>
      </form>
    </Modal>
  );
}
