import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, it, expect } from "vitest"
import { parse, type Rule } from "postcss"

// jsdom không áp globals.css — các quy tắc CSS quan trọng được khoá bằng cách parse chính file này.
// (postcss có sẵn trong node_modules: dependency của vite và @tailwindcss/postcss.)
const root = parse(readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8"))

const NO_PREFERENCE = "media (prefers-reduced-motion: no-preference)"
const REDUCE = "media (prefers-reduced-motion: reduce)"

// Các at-rule bọc quanh 1 rule, từ ngoài vào trong — vd. ["layer base", "media (prefers-reduced-motion: no-preference)"].
function wrappersOf(rule: Rule): string[] {
  const chain: string[] = []
  let parent = rule.parent
  while (parent?.type === "atrule") {
    chain.unshift(`${parent.name} ${parent.params}`)
    parent = parent.parent
  }
  return chain
}

function rulesFor(selector: string): Rule[] {
  const found: Rule[] = []
  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) found.push(rule)
  })
  return found
}

function declares(rule: Rule, prop: string, value?: string): boolean {
  return rule.some(
    (node) => node.type === "decl" && node.prop === prop && (value === undefined || node.value === value)
  )
}

describe("globals.css — giảm chuyển động", () => {
  it.each([".ob-conf", ".ob-firework-spark", ".ob-tada"])(
    "only animates %s when the user has not asked for reduced motion",
    (selector) => {
      const animated = rulesFor(selector).filter((rule) => declares(rule, "animation"))
      expect(animated.length).toBeGreaterThan(0)
      for (const rule of animated) expect(wrappersOf(rule)).toContain(NO_PREFERENCE)
    }
  )

  it("hides confetti pieces and firework sparks under reduced motion instead of leaving them frozen on the card", () => {
    const hidden: string[] = []
    root.walkRules((rule) => {
      if (wrappersOf(rule).includes(REDUCE) && declares(rule, "display", "none")) hidden.push(...rule.selectors)
    })
    expect(hidden.sort()).toEqual([".ob-conf", ".ob-firework-spark"])
  })
})

describe("globals.css — rule phần tử trần nằm trong @layer base", () => {
  it("keeps the press-scale `button:active` rule only inside @layer base, so a utility on a button can still override it", () => {
    const rules = rulesFor("button:active")
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) expect(wrappersOf(rule)[0]).toBe("layer base")
  })

  it("has no unlayered `*` rule — Tailwind preflight in @layer base already sets box-sizing", () => {
    for (const rule of rulesFor("*")) expect(wrappersOf(rule)[0]).toBe("layer base")
  })

  it("keeps the body rule inside @layer base, so Tailwind utilities on <body> can override it", () => {
    const rules = rulesFor("body")
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) expect(wrappersOf(rule)).toContain("layer base")
  })
})
