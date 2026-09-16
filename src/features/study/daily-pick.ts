import { sampleWithRng } from "./random-sample"

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

  function rnd(): number {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  return sampleWithRng(list, n, rnd)
}

export { seedFrom, pickDaily }
