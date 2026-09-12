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

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was denied. Allow microphone access for this site in your browser settings, then try again.",
  "service-not-allowed": "Microphone access was denied. Allow microphone access for this site in your browser settings, then try again.",
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

  function start() {
    setError(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Your browser doesn't support voice dictation. Try Chrome or Edge.");
      return;
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
