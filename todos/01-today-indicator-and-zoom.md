# 01 — Today indicator + zoom controls

**Priority:** High
**Area:** Gantt timeline

## Problem
The current `todayColor="rgba(99, 102, 241, 0.08)"` in [src/components/gantt/GanttView.tsx](../src/components/gantt/GanttView.tsx) is too subtle to spot, and users cannot quickly orient the timeline to today. The Day/Week/Month segmented control in [src/components/layout/Header.tsx](../src/components/layout/Header.tsx) is the only zoom mechanism.

## Proposal
- Render a clearly visible vertical "today" line on top of the chart (custom overlay div positioned over the SVG using the same date-to-x math the library uses).
- Add a "Jump to today" button in the header toolbar that scrolls the chart container so today is centered.
- Add `Quarter` and `Year` view modes alongside `Day | Week | Month`.

## Files to touch
- [src/components/gantt/GanttView.tsx](../src/components/gantt/GanttView.tsx)
- [src/components/layout/Header.tsx](../src/components/layout/Header.tsx)
- [src/types/index.ts](../src/types/index.ts) — extend `ViewModeKey`
- [src/store/useAppStore.ts](../src/store/useAppStore.ts) — accept new view modes

## Acceptance
- A vertical line marks today in every view mode and remains visible while scrolling.
- A toolbar button scrolls the chart so today is centered.
- Quarter and Year zoom levels render without overlapping bars.
