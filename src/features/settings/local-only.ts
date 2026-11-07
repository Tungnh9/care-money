import type { ExportSnapshot, ImportedSnapshot } from "@/lib/data-transfer"
import type { JournalEntry } from "@/lib/journal/types"
import type { LifeNote, LifePlan } from "@/lib/life-plan/types"
import { nextId } from "@/lib/next-id"

// Những gì máy này có mà bản sắp nạp không có — nạp thẳng là mất.
interface LocalOnly {
  journal: JournalEntry[]
  notes: LifeNote[]
  plans: LifePlan[]
}

// Bài nhật ký có id là mốc ms lúc viết — 2 máy gần như không thể trùng, nên trùng id là cùng 1 bài (bản sắp nạp có
// thể đã sửa chữ). Ghi chép và kế hoạch trang Plan đánh số max+1 trên từng máy: 2 máy cùng thêm sau lần đồng bộ cuối
// sẽ trùng id mà khác nội dung, nên phải trùng thêm ngày + tiêu đề (ghi chép) hay tên (kế hoạch) mới là 1. Sửa tiêu
// đề ở máy kia thì bản cũ trên máy này bị coi là riêng — giữ thừa 1 bản còn hơn mất 1 bài.
function sameNote(a: LifeNote, b: LifeNote): boolean {
  return a.id === b.id && a.day === b.day && a.title === b.title
}

function samePlan(a: LifePlan, b: LifePlan): boolean {
  return a.id === b.id && a.title === b.title
}

function findLocalOnly(incoming: ImportedSnapshot, local: ExportSnapshot): LocalOnly {
  const incomingEntryIds = new Set(incoming.journal.entries.map((entry) => entry.id))
  return {
    journal: local.journal.entries.filter((entry) => !incomingEntryIds.has(entry.id)),
    notes: local.lifePlan.notes.filter((note) => !incoming.lifePlan.notes.some((other) => sameNote(note, other))),
    plans: local.lifePlan.plans.filter((plan) => !incoming.lifePlan.plans.some((other) => samePlan(plan, other))),
  }
}

// "2 bài nhật ký · 1 ghi chép Plan", null khi không có gì.
function describeLocalOnly(only: LocalOnly): string | null {
  const parts = [
    only.journal.length ? `${only.journal.length} bài nhật ký` : null,
    only.notes.length ? `${only.notes.length} ghi chép Plan` : null,
    only.plans.length ? `${only.plans.length} kế hoạch` : null,
  ].filter((part): part is string => part !== null)
  return parts.length ? parts.join(" · ") : null
}

// Bản sắp nạp cộng phần chỉ có trên máy này. Bài nhật ký giữ id và xếp mới trước như lúc viết. Ghi chép / kế hoạch
// trùng id với bản sắp nạp thì đánh số mới; ghi chép gắn 1 kế hoạch được đánh số lại thì trỏ theo số mới, gắn kế
// hoạch không còn ở đâu cả thì bỏ gắn.
function keepLocalOnly(incoming: ImportedSnapshot, local: ExportSnapshot, only: LocalOnly): ImportedSnapshot {
  const entries = [...incoming.journal.entries, ...only.journal].sort((a, b) => b.id - a.id)

  const plans = [...incoming.lifePlan.plans]
  const planIds = new Map<number, number>()
  for (const plan of local.lifePlan.plans) {
    if (!only.plans.includes(plan)) planIds.set(plan.id, plan.id)
  }
  for (const plan of only.plans) {
    const id = plans.some((other) => other.id === plan.id) ? nextId(plans) : plan.id
    planIds.set(plan.id, id)
    plans.push({ ...plan, id })
  }

  const notes = [...incoming.lifePlan.notes]
  for (const { planId, ...note } of only.notes) {
    const id = notes.some((other) => other.id === note.id) ? nextId(notes) : note.id
    const mappedPlanId = planId === undefined ? undefined : planIds.get(planId)
    notes.push({ ...note, id, ...(mappedPlanId !== undefined ? { planId: mappedPlanId } : {}) })
  }

  return {
    ...incoming,
    journal: { ...incoming.journal, entries },
    lifePlan: { ...incoming.lifePlan, notes, plans },
  }
}

export { describeLocalOnly, findLocalOnly, keepLocalOnly, type LocalOnly }
