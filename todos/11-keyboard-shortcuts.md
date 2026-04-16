# 11 — Keyboard shortcuts

**Priority:** Medium
**Area:** Power-user UX

## Problem
The app has no keyboard shortcuts. Power users must mouse over to the header for every common action (new task, switch view mode, switch project).

## Proposal
- Wire a small global key handler in [src/App.tsx](../src/App.tsx) (or a `useShortcuts` hook):
  - `N` — new task in current project
  - `M` — new milestone
  - `1` / `2` / `3` — Day / Week / Month view
  - `⌘K` / `Ctrl+K` — open command palette / project switcher
  - `?` — show shortcut cheatsheet modal
- Surface hints in tooltips (e.g. `title="New task (N)"`).
- Skip handling when focus is inside an input, textarea, or contenteditable.

## Files to touch
- New: `src/lib/useShortcuts.ts`
- New: `src/components/modals/ShortcutsModal.tsx`
- [src/App.tsx](../src/App.tsx) — register shortcuts, wire `?` to open the modal
- [src/components/layout/Header.tsx](../src/components/layout/Header.tsx) — add hint text in `title`

## Acceptance
- Each shortcut performs the documented action when no input is focused.
- `?` opens a discoverable cheatsheet listing every shortcut.
- Shortcuts do not fire while typing in modal forms.
