# 07 — Progress slider improvements

**Priority:** Low-Medium
**Area:** Forms

## Problem
The progress control in [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx) is a bare range input. Setting a precise value with a pointer is awkward, and the slider thumb is not visually distinct from the track. There is no numeric input fallback.

## Proposal
- Place a numeric `<input type="number" min={0} max={100} step={5}>` next to the slider; both controls bind to the same state.
- Add tick marks at 0 / 25 / 50 / 75 / 100 with small labels.
- Style the thumb with a clear focus ring and 2px shadow.
- Snap to multiples of 5 when keyboard-driving (`Arrow ←/→` already does this with `step`).

## Files to touch
- [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx)
- [src/index.css](../src/index.css) — slider thumb / tick styling

## Acceptance
- Typing a number updates the slider and vice versa.
- Slider has visible focus state and ticks.
- Milestones still force progress to 0 (existing store invariant preserved).
