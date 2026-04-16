import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  VIEW_MODES,
  DISPLAY_MODES,
  APP_VIEWS,
  type ViewModeKey,
  type DisplayMode,
  type AppView,
} from '../types';

function isOneOf<T extends readonly string[]>(values: T, v: string | null): v is T[number] {
  return v !== null && (values as readonly string[]).includes(v);
}

export function useUrlSync() {
  const hydrated = useAppStore(s => s.hydrated);
  const currentProjectId = useAppStore(s => s.currentProjectId);
  const viewMode = useAppStore(s => s.viewMode);
  const displayMode = useAppStore(s => s.displayMode);
  const view = useAppStore(s => s.view);

  const didInitialRead = useRef(false);

  useEffect(() => {
    if (!hydrated || didInitialRead.current) return;
    didInitialRead.current = true;
    const params = new URLSearchParams(window.location.search);
    const state = useAppStore.getState();

    const urlProject = params.get('project');
    if (urlProject && state.projects.some(p => p.id === urlProject)) {
      state.setCurrentProject(urlProject);
    }
    const urlView = params.get('view');
    if (isOneOf(VIEW_MODES, urlView)) state.setViewMode(urlView as ViewModeKey);
    const urlDisplay = params.get('display');
    if (isOneOf(DISPLAY_MODES, urlDisplay)) state.setDisplayMode(urlDisplay as DisplayMode);
    const urlAppView = params.get('page');
    if (isOneOf(APP_VIEWS, urlAppView)) state.setView(urlAppView as AppView);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (currentProjectId) params.set('project', currentProjectId);
    params.set('view', viewMode);
    params.set('display', displayMode);
    params.set('page', view);
    const nextSearch = `?${params.toString()}`;
    if (nextSearch !== window.location.search) {
      window.history.replaceState(null, '', `${window.location.pathname}${nextSearch}`);
    }
  }, [hydrated, currentProjectId, viewMode, displayMode, view]);
}
