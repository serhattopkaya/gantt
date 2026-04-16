import type { Project, AppTask } from '../types';
import { fromISODate, toISODate, addDays, todayISO } from './dates';

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  avgProgress: number;
  upcomingMilestones: AppTask[];
  overdueTasks: AppTask[];
}

export interface OverallMetrics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  avgProgress: number;
  upcomingMilestones: Array<{ project: Project; task: AppTask }>;
  overdueTasks: Array<{ project: Project; task: AppTask }>;
  perProject: Map<string, ProjectMetrics>;
}

function metricsFromBucket(bucket: AppTask[], today: string, cutoffIso: string): ProjectMetrics {
  const upcomingMilestones: AppTask[] = [];
  const overdueTasks: AppTask[] = [];
  let regularCount = 0;
  let progressSum = 0;
  let completed = 0;

  for (const t of bucket) {
    if (t.type === 'milestone') {
      if (t.start >= today && t.start <= cutoffIso) upcomingMilestones.push(t);
      if (t.start < today && t.progress < 100) overdueTasks.push(t);
    } else {
      regularCount++;
      progressSum += t.progress;
      if (t.progress >= 100) completed++;
      if (t.end < today && t.progress < 100) overdueTasks.push(t);
    }
  }

  upcomingMilestones.sort((a, b) => a.start.localeCompare(b.start));

  return {
    totalTasks: bucket.length,
    completedTasks: completed,
    avgProgress: regularCount > 0 ? Math.round(progressSum / regularCount) : 0,
    upcomingMilestones,
    overdueTasks,
  };
}

export function computeProjectMetrics(
  projectId: string,
  tasks: AppTask[],
  horizonDays = 14
): ProjectMetrics {
  const today = todayISO();
  const cutoff = toISODate(addDays(fromISODate(today), horizonDays));
  const bucket = tasks.filter(t => t.projectId === projectId);
  return metricsFromBucket(bucket, today, cutoff);
}

export function computeOverallMetrics(
  projects: Project[],
  tasks: AppTask[],
  horizonDays = 14
): OverallMetrics {
  const today = todayISO();
  const cutoff = toISODate(addDays(fromISODate(today), horizonDays));

  const buckets = new Map<string, AppTask[]>();
  for (const p of projects) buckets.set(p.id, []);
  for (const t of tasks) {
    const bucket = buckets.get(t.projectId);
    if (bucket) bucket.push(t);
  }

  const perProject = new Map<string, ProjectMetrics>();
  const upcomingMilestones: Array<{ project: Project; task: AppTask }> = [];
  const overdueTasks: Array<{ project: Project; task: AppTask }> = [];
  let totalProgress = 0;
  let regularCount = 0;
  let completed = 0;

  for (const project of projects) {
    const bucket = buckets.get(project.id) ?? [];
    const m = metricsFromBucket(bucket, today, cutoff);
    perProject.set(project.id, m);
    for (const t of m.upcomingMilestones) upcomingMilestones.push({ project, task: t });
    for (const t of m.overdueTasks) overdueTasks.push({ project, task: t });
    for (const t of bucket) {
      if (t.type !== 'task') continue;
      regularCount++;
      totalProgress += t.progress;
    }
    completed += m.completedTasks;
  }

  upcomingMilestones.sort((a, b) => a.task.start.localeCompare(b.task.start));
  overdueTasks.sort((a, b) => a.task.end.localeCompare(b.task.end));

  return {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks: completed,
    avgProgress: regularCount > 0 ? Math.round(totalProgress / regularCount) : 0,
    upcomingMilestones,
    overdueTasks,
    perProject,
  };
}
