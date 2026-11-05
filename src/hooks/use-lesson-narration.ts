"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type NarrationPlaybackState = "idle" | "speaking" | "paused";

/**
 * Reads lesson slides aloud via the browser's built-in Web Speech API.
 * There's no server-side TTS provider configured for this app (no
 * ElevenLabs/Polly/etc. key), so narration runs entirely client-side —
 * zero infra cost, works offline once the page is loaded, and every
 * browser CareerOS targets already ships SpeechSynthesis.
 *
 * `rate` is tracked in a ref as well as state so `speak()` always reads
 * the latest value without needing to be re-created (and re-triggering
 * effects) every time the user changes playback speed.
 */
export function useLessonNarration() {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<NarrationPlaybackState>("idle");
  const [rate, setRateState] = useState(1);
  const rateRef = useRef(1);
  const onEndRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const setRate = useCallback((next: number) => {
    rateRef.current = next;
    setRateState(next);
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rateRef.current;
    utterance.onend = () => {
      setState("idle");
      onEndRef.current?.();
    };
    utterance.onerror = () => setState("idle");
    onEndRef.current = onEnd ?? null;
    window.speechSynthesis.speak(utterance);
    setState("speaking");
  }, []);

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.resume();
    setState("speaking");
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    onEndRef.current = null;
    window.speechSynthesis.cancel();
    setState("idle");
  }, []);

  return { supported, state, rate, setRate, speak, pause, resume, stop };
}
