"use client";

import { useEffect, useRef, useState } from "react";

/** The Web Speech API has no official TS lib types; this is the minimal
    shape this hook actually uses. Free, native, no server round trip. */
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  return (
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition
  );
}

/**
 * A "denied" error here doesn't always mean the site-level permission is
 * actually off — if the OS itself hasn't granted the browser app microphone
 * access at all (macOS/Windows privacy settings, separate from any
 * per-site permission inside the browser), every getUserMedia call fails
 * exactly the same way. Point at both, since there's no way to tell them
 * apart from here.
 */
const MIC_DENIED_MESSAGE =
  "Microphone access was denied. Check two places: the site permission (click the icon in your browser's address bar) and your operating system's microphone privacy settings for this browser (e.g. System Settings → Privacy & Security → Microphone on macOS) — many OSes block the browser app from the mic separately from any per-site permission.";

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": MIC_DENIED_MESSAGE,
  "service-not-allowed": MIC_DENIED_MESSAGE,
  "no-speech": "No speech was detected. Try again and speak right after pressing the mic.",
  "audio-capture": "No microphone was found. Check that a microphone is connected and not in use by another app.",
  network: "A network error interrupted speech recognition. Check your connection and try again.",
  aborted: "",
};

/** Speech-to-text via the browser's native Web Speech API — free, no
    third-party account, no server round trip. Calls onFinalText with each
    finalized chunk of transcribed speech while listening. */
export function useVoiceInput(onFinalText: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
  }, []);

  async function start() {
    setError(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Your browser doesn't support voice dictation. Try Chrome or Edge.");
      return;
    }

    /**
     * Explicitly requesting the mic via getUserMedia first — rather than
     * just calling recognition.start() and hoping the browser surfaces its
     * own prompt — guarantees the standard native "Allow microphone access"
     * dialog appears up front, and lets us react to a denial immediately
     * with a clear message instead of waiting on SpeechRecognition's own
     * (less consistent, browser-dependent) permission handling.
     */
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        // SpeechRecognition acquires its own capture internally right after
        // this — re-requesting the mic in the same instant the previous
        // grant was released has been observed to come back as a spurious
        // denial on some browsers even when permission is genuinely
        // granted. A brief pause lets the device actually release first.
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
          setError(MIC_DENIED_MESSAGE);
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setError("No microphone was found. Check that a microphone is connected and not in use by another app.");
        } else {
          setError("Couldn't access your microphone. Please try again.");
        }
        return;
      }
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) text += result[0].transcript;
      }
      if (text.trim()) onFinalText(text.trim());
    };
    recognition.onerror = (event) => {
      const message = ERROR_MESSAGES[event.error];
      setError(message || (message === "" ? null : `Voice input stopped: ${event.error}.`));
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Couldn't start voice input. Please try again.");
    }
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return { supported, listening, error, start, stop };
}
