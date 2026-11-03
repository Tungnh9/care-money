import type { WorkTask } from "@/lib/work/types"

// 2026-10-13 là thứ Ba.
export const TODAY = "2026-10-13"

export function task(overrides: Partial<WorkTask> & { id: number }): WorkTask {
  return {
    title: `Việc ${overrides.id}`,
    dueDate: null,
    priority: "normal",
    columnId: 1,
    done: false,
    doneAt: null,
    createdAt: "2026-10-01",
    ...overrides,
  }
}
