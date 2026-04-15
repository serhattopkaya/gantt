import { v4 as uuid } from 'uuid';
import type { Project, AppTask } from '../types';
import { defaultColor } from './colors';
import { toISODate, addDays } from './dates';

export function createSeedData(): { project: Project; tasks: AppTask[] } {
  const projectId = uuid();
  const now = new Date();

  const t1Id = uuid();
  const t2Id = uuid();
  const t3Id = uuid();
  const m1Id = uuid();

  const project: Project = {
    id: projectId,
    name: 'My First Project',
    color: defaultColor(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const tasks: AppTask[] = [
    {
      id: t1Id,
      projectId,
      type: 'task',
      name: 'Project Kickoff',
      start: toISODate(now),
      end: toISODate(addDays(now, 4)),
      progress: 100,
      dependencies: [],
      displayOrder: 0,
    },
    {
      id: t2Id,
      projectId,
      type: 'task',
      name: 'Design Phase',
      start: toISODate(addDays(now, 5)),
      end: toISODate(addDays(now, 14)),
      progress: 60,
      dependencies: [t1Id],
      displayOrder: 1,
    },
    {
      id: t3Id,
      projectId,
      type: 'task',
      name: 'Development',
      start: toISODate(addDays(now, 15)),
      end: toISODate(addDays(now, 35)),
      progress: 20,
      dependencies: [t2Id],
      displayOrder: 2,
    },
    {
      id: m1Id,
      projectId,
      type: 'milestone',
      name: 'Launch',
      start: toISODate(addDays(now, 36)),
      end: toISODate(addDays(now, 36)),
      progress: 0,
      dependencies: [t3Id],
      displayOrder: 3,
    },
  ];

  return { project, tasks };
}
