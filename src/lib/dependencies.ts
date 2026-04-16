import type { AppTask } from '../types';

/**
 * Detects whether assigning `candidateDeps` as the predecessors of `taskId`
 * would introduce a cycle, given the rest of `allTasks` as-is.
 *
 * A dependency edge `a -> b` means "a depends on b" (b must finish first).
 * A cycle exists when, walking .dependencies from any candidate, we can
 * reach `taskId` again.
 *
 * Returns the offending path as task *names* (starting and ending with
 * `taskId`'s name), or null if safe. `taskId` may be a not-yet-created id;
 * `candidateName` supplies its display name in that case.
 */
export function hasCycle(
  taskId: string,
  candidateDeps: string[],
  allTasks: AppTask[],
  candidateName?: string
): string[] | null {
  const byId = new Map<string, AppTask>();
  for (const t of allTasks) byId.set(t.id, t);

  const nameOf = (id: string): string => {
    if (id === taskId) return candidateName ?? byId.get(id)?.name ?? id;
    return byId.get(id)?.name ?? id;
  };

  for (const dep of candidateDeps) {
    if (dep === taskId) return [nameOf(taskId), nameOf(taskId)];
  }

  for (const seed of candidateDeps) {
    if (!byId.has(seed)) continue;
    const stack: { id: string; path: string[] }[] = [
      { id: seed, path: [taskId, seed] },
    ];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const { id, path } = stack.pop()!;
      if (id === taskId) return path.map(nameOf);
      if (visited.has(id)) continue;
      visited.add(id);
      const node = byId.get(id);
      if (!node) continue;
      for (const next of node.dependencies) {
        stack.push({ id: next, path: [...path, next] });
      }
    }
  }

  return null;
}
