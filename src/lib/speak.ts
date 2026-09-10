function speakWord(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = "en-US"
  window.speechSynthesis.speak(utterance)
}

export { speakWord }
