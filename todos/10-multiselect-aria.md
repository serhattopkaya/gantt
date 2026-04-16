# 10 — MultiSelect ARIA fixes

**Priority:** Medium
**Area:** Accessibility

## Problem
[src/components/common/MultiSelect.tsx](../src/components/common/MultiSelect.tsx) sets `role="listbox"` on a `<ul>`, but the `<li>` children carry no `role="option"` — only the inner buttons do. The trigger lacks `aria-controls` / `aria-expanded`, and the search input has no label. There is no arrow-key navigation.

## Proposal
- Move `role="option"` and `aria-selected` to the `<li>` directly.
- On the trigger button, add `aria-haspopup="listbox"`, `aria-expanded={open}`, `aria-controls={listboxId}`.
- Label the search input with `aria-label="Filter options"`.
- Implement arrow-key navigation: ↑/↓ moves the active option, Enter toggles it, Esc closes.
- Add `aria-activedescendant` on the listbox to track the highlighted option.

## Files to touch
- [src/components/common/MultiSelect.tsx](../src/components/common/MultiSelect.tsx)

## Acceptance
- VoiceOver / NVDA announce listbox semantics correctly (item N of M, selected/not).
- Keyboard-only users can open, filter, navigate, select, and close without a mouse.
- Click and touch behavior unchanged.
