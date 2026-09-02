type Listener = () => void

const listeners = new Set<Listener>()

function notifyDataChanged() {
  listeners.forEach((listener) => listener())
}

function onDataChanged(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export { notifyDataChanged, onDataChanged }
