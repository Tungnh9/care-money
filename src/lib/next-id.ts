function nextId(existing: { id: number }[]) {
  // Date.now() có thể trùng nếu add 2 lần trong cùng 1ms — dùng max(id hiện có)+1 để chắc chắn không đụng.
  return existing.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

export { nextId }
