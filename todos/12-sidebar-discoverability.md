# 12 — Sidebar action discoverability

**Priority:** Medium
**Area:** Discoverability / touch

## Problem
The kebab/edit/delete menu in [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx) only appears on hover. On touch devices it is invisible, and even on desktop the affordance is hidden.

## Proposal
- Always render the kebab icon at low opacity (e.g. `text-slate-300`); raise to `text-slate-700` on row hover/focus.
- Show a 2px left border in the project's color when active (a stronger active cue than the dot).
- Make the entire row keyboard-focusable; opening the kebab menu via `Enter` or `Space` should also open it via the keyboard.

## Files to touch
- [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx)
- [src/components/common/IconButton.tsx](../src/components/common/IconButton.tsx) — verify focus styling

## Acceptance
- Kebab icon is visible at all times, more prominent on hover.
- Active project shows a colored left border in addition to the dot.
- Keyboard users can reach and trigger every row action.
- Touch users see and can hit the action target.
