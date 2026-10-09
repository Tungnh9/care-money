import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, it, expect } from "vitest"

// Quy ước CLAUDE.md mục 3: feature chỉ import chính nó; src/app chỉ import barrel "@/features/<x>";
// src/components và src/lib không import feature. Test này giữ quy ước khỏi trôi (Task 17 bước 5 cũ chỉ chạy tay).
const IMPORT_OF_FEATURE = /["']@\/features\/([a-z-]+)(\/[^"']*)?["']/g
const cwd = process.cwd()

function crossFeatureImports(): string[] {
  const problems: string[] = []

  function check(file: string) {
    const own = file.match(/^src\/features\/([a-z-]+)\//)?.[1]
    for (const [, feature, subpath = ""] of readFileSync(path.join(cwd, file), "utf8").matchAll(IMPORT_OF_FEATURE)) {
      if (feature === own) continue
      if (file.startsWith("src/app/") && subpath === "") continue
      problems.push(`${file} -> @/features/${feature}${subpath}`)
    }
  }

  function walk(dir: string) {
    for (const entry of readdirSync(path.join(cwd, dir), { withFileTypes: true })) {
      const file = path.posix.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (/\.tsx?$/.test(entry.name)) check(file)
    }
  }

  walk("src")
  return problems
}

describe("ranh giới feature", () => {
  it("has no import that reaches into another feature", () => {
    expect(crossFeatureImports()).toEqual([])
  })
})
