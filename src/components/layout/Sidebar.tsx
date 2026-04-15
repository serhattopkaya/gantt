import { useState } from 'react';
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ProjectModal } from '../modals/ProjectModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import type { Project } from '../../types';

interface SidebarProps {
  onAddProject: () => void;
}

export function Sidebar({ onAddProject }: SidebarProps) {
  const projects = useAppStore(s => s.projects);
  const tasks = useAppStore(s => s.tasks);
  const currentProjectId = useAppStore(s => s.currentProjectId);
  const setCurrentProject = useAppStore(s => s.setCurrentProject);
  const deleteProject = useAppStore(s => s.deleteProject);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function getTaskCount(projectId: string) {
    return tasks.filter(t => t.projectId === projectId).length;
  }

  function handleDeleteConfirm() {
    if (deletingProject) {
      deleteProject(deletingProject.id);
      setDeletingProject(null);
    }
  }

  return (
    <>
      <aside className="w-[280px] flex-shrink-0 h-full flex flex-col bg-slate-50 border-r border-slate-200">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="8" height="2" rx="1" fill="white" />
              <rect x="2" y="8" width="12" height="2" rx="1" fill="white" opacity="0.7" />
              <rect x="2" y="12" width="6" height="2" rx="1" fill="white" opacity="0.5" />
            </svg>
          </div>
          <span className="font-semibold text-slate-900 text-sm">GanttApp</span>
        </div>

        {/* Projects heading + add button */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</span>
          <button
            onClick={onAddProject}
            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            aria-label="New project"
            title="New project"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Project list */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {projects.length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-6 px-2">
              No projects yet. Create one to get started.
            </p>
          )}
          {projects.map(project => {
            const isActive = project.id === currentProjectId;
            const count = getTaskCount(project.id);
            return (
              <div
                key={project.id}
                className="relative group"
              >
                <button
                  onClick={() => {
                    setCurrentProject(project.id);
                    setOpenMenuId(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive
                      ? 'bg-white shadow-sm text-slate-900 font-medium'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 truncate text-left">{project.name}</span>
                  <span className="text-xs text-slate-400 tabular-nums">{count}</span>
                </button>

                {/* Kebab menu */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === project.id ? null : project.id);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    aria-label="Project options"
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {openMenuId === project.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                      <button
                        onClick={() => { setEditingProject(project); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => { setDeletingProject(project); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Add project button at bottom */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={onAddProject}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all"
          >
            <Plus size={16} />
            New project
          </button>
        </div>
      </aside>

      {/* Close open menu on outside click */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {editingProject && (
        <ProjectModal
          mode="edit"
          initial={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}

      {deletingProject && (
        <ConfirmDialog
          title="Delete project"
          description={`"${deletingProject.name}" and all its tasks will be permanently deleted. This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingProject(null)}
        />
      )}
    </>
  );
}
