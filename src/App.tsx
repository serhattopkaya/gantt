import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GanttView } from './components/gantt/GanttView';
import { EmptyState } from './components/common/EmptyState';
import { ProjectModal } from './components/modals/ProjectModal';
import { TaskModal } from './components/modals/TaskModal';
import type { AppTask, AppTaskType } from './types';

type ModalState =
  | { type: 'none' }
  | { type: 'newProject' }
  | { type: 'editProject' }
  | { type: 'newTask'; taskType: AppTaskType }
  | { type: 'editTask'; task: AppTask };

export default function App() {
  const hydrate = useAppStore(s => s.hydrate);
  const hydrated = useAppStore(s => s.hydrated);
  const projects = useAppStore(s => s.projects);
  const currentProjectId = useAppStore(s => s.currentProjectId);
  const setCurrentProject = useAppStore(s => s.setCurrentProject);

  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentProject = projects.find(p => p.id === currentProjectId) ?? null;

  function closeModal() {
    setModal({ type: 'none' });
  }

  return (
    <div className="h-full flex">
      <Sidebar onAddProject={() => setModal({ type: 'newProject' })} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onAddTask={() => setModal({ type: 'newTask', taskType: 'task' })}
          onAddMilestone={() => setModal({ type: 'newTask', taskType: 'milestone' })}
          onEditProject={() => setModal({ type: 'editProject' })}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {!currentProject ? (
            <EmptyState
              variant="no-project"
              onAction={() => setModal({ type: 'newProject' })}
            />
          ) : (
            <GanttView
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
      {modal.type === 'editTask' && currentProjectId && (
        <TaskModal
          mode="edit"
          initial={modal.task}
          projectId={currentProjectId}
          onClose={closeModal}
        />
      )}

      {/* Click outside sidebar menus: handled in Sidebar */}
      {/* Switch project if currentProjectId is null but projects exist */}
      {hydrated && !currentProjectId && projects.length > 0 && (
        <div className="hidden" ref={el => {
          if (el) setCurrentProject(projects[0].id);
        }} />
      )}
    </div>
  );
}
