function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function seedFrom(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pickDaily<T>(list: T[], n: number, key: string, salt: string): T[] {
  let seed = seedFrom(`${key}|${salt}`)
  const pool = list.map((_, i) => i)
  const out: T[] = []

  function rnd(): number {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  while (out.length < n && pool.length) {
    const [index] = pool.splice(Math.floor(rnd() * pool.length), 1)
    out.push(list[index])
  }

  return out
}

export { dayKey, seedFrom, pickDaily }
