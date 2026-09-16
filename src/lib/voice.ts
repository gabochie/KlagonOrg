"use client";

// Web Speech API helpers — free, in-browser voice for the sales agent.
// Gracefully feature-detects; falls back to text when unsupported.

type Recog = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

interface SRWindow extends Window {
  SpeechRecognition?: new () => Recog;
  webkitSpeechRecognition?: new () => Recog;
}

export function recognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as SRWindow;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function createRecognition(opts: {
  onResult: (text: string, final: boolean) => void;
  onEnd: () => void;
  onError: (error: string) => void;
}): Recog | null {
  if (typeof window === "undefined") return null;
  const w = window as SRWindow;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = "en-GH";
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = false;

  rec.onresult = (e: unknown) => {
    const ev = e as {
      resultIndex?: number;
      results?: ArrayLike<ArrayLike<{ transcript?: string }> & { isFinal: boolean }>;
    };
    if (!ev.results) return;
    let interim = "";
    let final = "";
    for (let i = 0; i < ev.results.length; i++) {
      const r = ev.results[i];
      const transcript = r[0]?.transcript ?? "";
      if (r.isFinal) final += transcript;
      else interim += transcript;
    }
    const text = final || interim || "";
    if (text.trim()) opts.onResult(text, Boolean(final));
  };
  rec.onend = () => opts.onEnd();
  rec.onerror = (e: unknown) => {
    const ev = e as { error?: string };
    opts.onError(ev?.error ?? "unknown");
  };

  return rec;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function speak(
  text: string,
  opts: { rate?: number; onEnd?: () => void } = {}
): boolean {
  if (!speechSupported()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-GH";
  utter.rate = opts.rate ?? 1;
  utter.pitch = 1.05;

  const voices = synth.getVoices();
  const prefer = voices.find(
    (v) => v.lang?.toLowerCase().startsWith("en-gh")
  ) ?? voices.find((v) => v.lang?.toLowerCase().startsWith("en-gb"));
  if (prefer) utter.voice = prefer;

  utter.onend = () => opts.onEnd?.();
  synth.speak(utter);
  return true;
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}