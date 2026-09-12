"use client";

import { useEffect, useState } from "react";

/** Text-to-speech via the browser's native SpeechSynthesis API — free, no
    third-party account, no server round trip. Same free-and-local pattern
    as useVoiceInput's speech recognition. */
export function useVoiceOutput() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  function speak(text: string) {
    if (!supported || muted || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  return { supported, speaking, muted, setMuted, speak, stop };
}
