import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// jsdom's Blob/File implementation doesn't provide the standard .text() method
// (https://github.com/jsdom/jsdom/issues/2555) — polyfill it via FileReader, which jsdom does support.
if (typeof Blob !== "undefined" && !Blob.prototype.text) {
  Blob.prototype.text = function text(this: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(this)
    })
  }
}

afterEach(() => {
  cleanup()
})
