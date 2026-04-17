import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Edit, Trash2, MoreHorizontal, ChevronsLeft, ChevronsRight, LayoutDashboard, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
import { ProjectModal } from '../modals/ProjectModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import type { Project } from '../../types';

interface SidebarProps {
  onAddProject: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ onAddProject, mobileOpen, onMobileClose }: SidebarProps) {
  const projects = useAppStore(s => s.projects);
  const tasks = useAppStore(s => s.tasks);
  const currentProjectId = useAppStore(s => s.currentProjectId);
  const view = useAppStore(s => s.view);
  const setCurrentProject = useAppStore(s => s.setCurrentProject);
  const setView = useAppStore(s => s.setView);
  const deleteProject = useAppStore(s => s.deleteProject);
  const restoreProject = useAppStore(s => s.restoreProject);
  const sidebarCollapsed = useAppStore(s => s.sidebarCollapsed);
  const toggleSidebar = useAppStore(s => s.toggleSidebar);
  const pushToast = useToastStore(s => s.push);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const taskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) counts.set(t.projectId, (counts.get(t.projectId) ?? 0) + 1);
    return counts;
  }, [tasks]);

  function handleDeleteConfirm() {
    if (!deletingProject) return;
    const snapshotProject = deletingProject;
    const snapshotTasks = tasks.filter(t => t.projectId === snapshotProject.id);
    deleteProject(snapshotProject.id);
    setDeletingProject(null);
    pushToast({
      message: `Deleted "${snapshotProject.name}"`,
      action: {
        label: 'Undo',
        run: () => restoreProject(snapshotProject, snapshotTasks),
      },
    });
  }

  // On mobile (< md) the sidebar is a fixed off-canvas drawer; on md+ it's static.
  // Collapsed state only applies on desktop; the mobile drawer always shows labels.
  const desktopWidth = sidebarCollapsed ? 'md:w-[64px]' : 'md:w-[280px]';
  const mobileTranslate = mobileOpen ? 'translate-x-0' : '-translate-x-full';
  const showLabels = !sidebarCollapsed || mobileOpen;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] ${mobileTranslate} md:static md:translate-x-0 md:z-auto ${desktopWidth} h-full flex flex-col bg-surface-alt border-r border-border transition-[width,transform] duration-200`}
        aria-label="Projects sidebar"
      >
        {/* Logo + collapse toggle */}
        <div className={`flex items-center h-16 border-b border-border ${showLabels ? 'justify-between px-5' : 'justify-center px-2'}`}>
          {showLabels ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="4" width="8" height="2" rx="1" fill="white" />
                    <rect x="2" y="8" width="12" height="2" rx="1" fill="white" opacity="0.7" />
                    <rect x="2" y="12" width="6" height="2" rx="1" fill="white" opacity="0.5" />
                  </svg>
                </div>
                <span className="font-semibold text-text-primary text-sm">PlanTrack</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleSidebar}
                  className="hidden md:flex w-7 h-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={onMobileClose}
                  className="flex md:hidden w-7 h-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
                  aria-label="Close sidebar"
                >
                  <X size={16} />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronsRight size={16} />
            </button>
          )}
        </div>

        {/* Overview link */}
        <div className={`${showLabels ? 'px-3' : 'px-2'} pt-3`}>
          <button
            onClick={() => {
              setView('dashboard');
              onMobileClose();
            }}
            className={`w-full flex items-center gap-2.5 ${showLabels ? 'px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-sm transition-colors ${
              view === 'dashboard'
                ? 'bg-surface shadow-sm text-text-primary font-medium'
                : 'text-text-secondary hover:bg-surface/70 hover:text-text-primary'
            }`}
            title={!showLabels ? 'Overview' : undefined}
            aria-current={view === 'dashboard' ? 'page' : undefined}
          >
            <LayoutDashboard size={16} className="flex-shrink-0" />
            {showLabels && <span className="flex-1 text-left">Overview</span>}
          </button>
        </div>

        {/* Projects heading */}
        {showLabels && (
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Projects</span>
            <button
              onClick={onAddProject}
              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              aria-label="New project"
              title="New project"
            >
              <Plus size={15} />
            </button>
          </div>
        )}

        {/* Project list */}
        <nav className={`flex-1 overflow-y-auto ${showLabels ? 'px-3' : 'px-2'} pb-4`}>
          {projects.length === 0 && showLabels && (
            <p className="text-xs text-text-muted text-center mt-6 px-2">
              No projects yet. Create one to get started.
            </p>
          )}
          {projects.map(project => {
            const isActive = project.id === currentProjectId && view === 'project';
            const count = taskCounts.get(project.id) ?? 0;
            return (
              <div
                key={project.id}
                className="relative group"
              >
                <button
                  onClick={() => {
                    setCurrentProject(project.id);
                    setView('project');
                    setOpenMenuId(null);
                    onMobileClose();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'ArrowRight' && !sidebarCollapsed && showLabels) {
                      e.preventDefault();
                      setOpenMenuId(project.id);
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 ${showLabels ? 'px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-sm transition-colors relative ${
                    isActive
                      ? 'bg-surface shadow-sm text-text-primary font-medium'
                      : 'text-text-secondary hover:bg-surface/70 hover:text-text-primary'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  title={!showLabels ? project.name : undefined}
                  style={
                    isActive
                      ? {
                          boxShadow: `inset 2px 0 0 ${project.color}`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                    aria-hidden="true"
                  />
                  {showLabels && (
                    <>
                      <span className="flex-1 truncate text-left">{project.name}</span>
                      <span
                        className={`text-xs text-text-muted tabular-nums pr-6 transition-opacity ${
                          openMenuId === project.id
                            ? 'opacity-0'
                            : 'group-hover:opacity-0 group-focus-within:opacity-0'
                        }`}
                      >
                        {count}
                      </span>
                    </>
                  )}
                </button>

                {/* Kebab menu */}
                {showLabels && (
                  <div
                    ref={openMenuId === project.id ? menuRef : undefined}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === project.id ? null : project.id);
                      }}
                      className={`w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-border focus:text-text-primary focus:bg-border transition-opacity ${
                        openMenuId === project.id
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100'
                      }`}
                      aria-label={`${project.name} options`}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === project.id}
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {openMenuId === project.id && (
                      <div role="menu" className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                        <button
                          role="menuitem"
                          onClick={() => { setEditingProject(project); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted transition-colors"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => { setDeletingProject(project); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Add project button at bottom */}
        <div className={`${showLabels ? 'p-3' : 'p-2'} border-t border-border`}>
          <button
            onClick={onAddProject}
            className={`w-full flex items-center gap-2 ${showLabels ? 'px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-sm text-text-secondary hover:bg-surface hover:text-text-primary hover:shadow-sm transition-all`}
            aria-label="New project"
            title={!showLabels ? 'New project' : undefined}
          >
            <Plus size={16} />
            {showLabels && <span>New project</span>}
          </button>
        </div>
      </aside>

      {editingProject && (
        <ProjectModal
          mode="edit"
          initial={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}

      {deletingProject && (() => {
        const projectTasks = tasks.filter(t => t.projectId === deletingProject.id);
        const taskCount = projectTasks.filter(t => t.type === 'task').length;
        const milestoneCount = projectTasks.filter(t => t.type === 'milestone').length;
        const groupCount = projectTasks.filter(t => t.type === 'group').length;
        const parts: string[] = [];
        if (taskCount > 0) parts.push(`${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`);
        if (milestoneCount > 0) parts.push(`${milestoneCount} ${milestoneCount === 1 ? 'milestone' : 'milestones'}`);
        if (groupCount > 0) parts.push(`${groupCount} ${groupCount === 1 ? 'group' : 'groups'}`);
        return (
          <ConfirmDialog
            title="Delete project"
            description={`"${deletingProject.name}" will be permanently deleted. This cannot be undone.`}
            body={
              projectTasks.length === 0 ? (
                <p className="text-text-muted">This project has no tasks.</p>
              ) : (
                <p className="text-text-secondary">
                  Also deletes{' '}
                  <span className="font-medium text-text-primary">
                    {parts.join(', ')}
                  </span>
                  .
                </p>
              )
            }
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingProject(null)}
          />
        );
      })()}
    </>
  );
}
