import type { StoredState } from '../types';

const STORAGE_KEY = 'gantt-app:v1';
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: StoredState | null = null;

function isValidStoredState(v: unknown): v is StoredState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  if (s.version !== 1) return false;
  if (!Array.isArray(s.projects) || !Array.isArray(s.tasks)) return false;
  for (const p of s.projects as unknown[]) {
    if (!p || typeof p !== 'object') return false;
    const proj = p as Record<string, unknown>;
    if (typeof proj.id !== 'string' || typeof proj.name !== 'string' || typeof proj.color !== 'string') return false;
  }
  for (const t of s.tasks as unknown[]) {
    if (!t || typeof t !== 'object') return false;
    const task = t as Record<string, unknown>;
    if (
      typeof task.id !== 'string' ||
      typeof task.projectId !== 'string' ||
      typeof task.name !== 'string' ||
      !ISO_DATE_RE.test(String(task.start)) ||
      !ISO_DATE_RE.test(String(task.end))
    ) return false;
  }
  return true;
}

export function loadState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredState(parsed)) {
      console.warn('[gantt] Stored state failed validation; starting fresh.');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function flushSave() {
  if (pendingState === null) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingState));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('[gantt] localStorage quota exceeded; could not save state.');
    }
  }
  pendingState = null;
  debounceTimer = null;
}

export function saveState(state: StoredState): void {
  pendingState = state;
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushSave, 100);
}

// Flush any pending save immediately when the tab is about to close
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushSave);
}
