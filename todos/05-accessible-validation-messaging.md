# 05 — Accessible validation messaging

**Priority:** Medium
**Area:** Accessibility / forms

## Problem
Form errors in [src/components/modals/ProjectModal.tsx](../src/components/modals/ProjectModal.tsx) and [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx) render as plain `<span>` elements. Screen readers do not announce them, and the inputs are not linked to their error text.

## Proposal
- Wrap each error span in `role="alert"` with `aria-live="polite"`.
- Give each error a stable id and link the corresponding input via `aria-describedby`.
- Toggle `aria-invalid="true"` on the input when an error is present.

## Files to touch
- [src/components/modals/ProjectModal.tsx](../src/components/modals/ProjectModal.tsx)
- [src/components/modals/TaskModal.tsx](../src/components/modals/TaskModal.tsx)
- Consider extracting a `<FieldError>` component in `src/components/common/`.

## Acceptance
- VoiceOver / NVDA announce the error text the moment it appears.
- The input announces "invalid" and reads its associated error message.
- No visual regression — the existing red text styling stays intact.
