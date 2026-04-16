import { useEffect, useRef, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GanttView, type GanttViewHandle } from './components/gantt/GanttView';
import { EmptyState } from './components/common/EmptyState';
import { Toaster } from './components/common/Toaster';
import { SampleDataBanner } from './components/common/SampleDataBanner';
import { Dashboard } from './components/dashboard/Dashboard';
import { TaskListView } from './components/list/TaskListView';
import { NotesView } from './components/notes/NotesView';
import { ProjectModal } from './components/modals/ProjectModal';
import { TaskModal } from './components/modals/TaskModal';
import { useApplyTheme } from './lib/useTheme';
import { useUrlSync } from './lib/useUrlSync';
import type { AppTask, AppTaskType } from './types';

type ModalState =
  | { type: 'none' }
  | { type: 'newProject' }
  | { type: 'editProject' }
  | { type: 'newTask'; taskType: AppTaskType }
  | { type: 'editTask'; task: AppTask };

export default function App() {
  const hydrated = useAppStore(s => s.hydrated);
  const projects = useAppStore(s => s.projects);
  const currentProjectId = useAppStore(s => s.currentProjectId);
  const setCurrentProject = useAppStore(s => s.setCurrentProject);
  const view = useAppStore(s => s.view);
  const setView = useAppStore(s => s.setView);
  const displayMode = useAppStore(s => s.displayMode);
  const theme = useAppStore(s => s.theme);

  useApplyTheme(theme);
  useUrlSync();

  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const ganttRef = useRef<GanttViewHandle>(null);

  useEffect(() => {
    useAppStore.getState().hydrate();
  }, []);

  // Auto-select first project if none is selected (e.g. after deletion)
  useEffect(() => {
    if (hydrated && !currentProjectId && projects.length > 0 && view === 'project') {
      setCurrentProject(projects[0].id);
    }
  }, [hydrated, currentProjectId, projects, setCurrentProject, view]);

  // If the task being edited belongs to a project that's been deleted,
  // suppress the modal rather than rendering against a stale task.
  const editTaskProjectExists =
    modal.type !== 'editTask' || projects.some(p => p.id === modal.task.projectId);

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentProject = projects.find(p => p.id === currentProjectId) ?? null;

  function closeModal() {
    setModal({ type: 'none' });
  }

  function openProject(projectId: string) {
    setCurrentProject(projectId);
    setView('project');
  }

  return (
    <div className="h-full flex bg-surface">
      <Sidebar
        onAddProject={() => setModal({ type: 'newProject' })}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onAddTask={() => setModal({ type: 'newTask', taskType: 'task' })}
          onAddMilestone={() => setModal({ type: 'newTask', taskType: 'milestone' })}
          onAddGroup={() => setModal({ type: 'newTask', taskType: 'group' })}
          onEditProject={() => setModal({ type: 'editProject' })}
          onJumpToToday={() => ganttRef.current?.jumpToToday()}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <SampleDataBanner />

        <main className="flex-1 overflow-hidden flex flex-col">
          {view === 'dashboard' ? (
            <Dashboard onOpenProject={openProject} />
          ) : !currentProject ? (
            <EmptyState
              variant="no-project"
              onAction={() => setModal({ type: 'newProject' })}
            />
          ) : displayMode === 'list' ? (
            <TaskListView
              project={currentProject}
              onEditTask={task => setModal({ type: 'editTask', task })}
              onAddTask={() => setModal({ type: 'newTask', taskType: 'task' })}
            />
          ) : displayMode === 'notes' ? (
            <NotesView project={currentProject} />
          ) : (
            <GanttView
              ref={ganttRef}
              project={currentProject}
              onEditTask={task => setModal({ type: 'editTask', task })}
              onAddTask={() => setModal({ type: 'newTask', taskType: 'task' })}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {modal.type === 'newProject' && (
        <ProjectModal mode="create" onClose={closeModal} />
      )}
      {modal.type === 'editProject' && currentProject && (
        <ProjectModal mode="edit" initial={currentProject} onClose={closeModal} />
      )}
      {modal.type === 'newTask' && currentProjectId && (
        <TaskModal
          mode="create"
          projectId={currentProjectId}
          defaultType={modal.taskType}
          onClose={closeModal}
        />
      )}
      {modal.type === 'editTask' && editTaskProjectExists && (
        <TaskModal
          mode="edit"
          initial={modal.task}
          projectId={modal.task.projectId}
          onClose={closeModal}
        />
      )}

      <Toaster />
    </div>
  );
}
