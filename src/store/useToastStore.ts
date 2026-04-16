import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
  durationMs: number;
}

interface ToastStoreState {
  toasts: Toast[];
  push: (input: { message: string; action?: Toast['action']; durationMs?: number }) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastStoreState>(set => ({
  toasts: [],
  push({ message, action, durationMs = 6000 }) {
    const id = nextId++;
    set(s => ({ toasts: [...s.toasts, { id, message, action, durationMs }] }));
    return id;
  },
  dismiss(id) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  },
}));
