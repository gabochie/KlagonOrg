"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";

const HIGHLIGHT_CLASS = "read-aloud-highlight";
const RATES = [0.75, 1, 1.25];

interface Block {
  el: HTMLElement;
  text: string;
}

function pickVoice(): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis;
  const voices = synth?.getVoices?.() ?? [];
  const gh = voices.find((v) => v.lang?.toLowerCase().replace("_", "-").startsWith("en-gh"));
  const en = voices.find((v) => v.lang?.toLowerCase().startsWith("en"));
  return gh ?? en ?? null;
}

export function ReadAloud({ targetId }: { targetId: string }) {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [rate, setRate] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const blocksRef = useRef<Block[]>([]);
  const indexRef = useRef(0);
  const rateRef = useRef(1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const refresh = () => setVoice(pickVoice());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
      const synth = window.speechSynthesis;
      if (synth) {
        synth.cancel();
        blocksRef.current.forEach((b) => b.el.classList.remove(HIGHLIGHT_CLASS));
      }
    };
  }, []);

  const collectBlocks = (): Block[] => {
    const el = document.getElementById(targetId);
    if (!el) return [];
    const nodes = Array.from(
      el.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, li, blockquote, td, figcaption")
    );
    const blocks: Block[] = [];
    for (const node of nodes) {
      const text = (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
      if (text) blocks.push({ el: node, text });
    }
    return blocks;
  };

  const clearHighlights = () => {
    blocksRef.current.forEach((b) => b.el.classList.remove(HIGHLIGHT_CLASS));
  };

  const speakAt = (i: number) => {
    const synth = window.speechSynthesis;
    if (!synth || i < 0 || i >= blocksRef.current.length) {
      setState("idle");
      return;
    }
    blocksRef.current.forEach((b) => b.el.classList.remove(HIGHLIGHT_CLASS));
    const target = blocksRef.current[i];
    target.el.classList.add(HIGHLIGHT_CLASS);
    indexRef.current = i;
    const u = new SpeechSynthesisUtterance(target.text);
    u.rate = rateRef.current;
    if (voiceRef.current) {
      u.voice = voiceRef.current;
      u.lang = voiceRef.current.lang;
    } else {
      u.lang = "en-GH";
    }
    u.onend = () => {
      target.el.classList.remove(HIGHLIGHT_CLASS);
      speakAt(i + 1);
    };
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      target.el.classList.remove(HIGHLIGHT_CLASS);
      setState("idle");
    };
    synth.speak(u);
  };

  const play = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (state === "paused") {
      synth.resume();
      setState("playing");
      return;
    }
    blocksRef.current = collectBlocks();
    if (blocksRef.current.length === 0) return;
    synth.cancel();
    indexRef.current = 0;
    speakAt(0);
  };

  const pause = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.pause();
    setState("paused");
  };

  const stop = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    clearHighlights();
    indexRef.current = 0;
    setState("idle");
  };

  const active = state !== "idle";

  return (
    <div className="mb-5 inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-label={state === "playing" ? "Pause reading" : "Read this article aloud"}
        onClick={() => (state === "playing" ? pause() : play())}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold cursor-pointer transition-colors font-sans ${
          active ? "bg-amber text-navy" : "bg-white dark:bg-ink-2 border border-border text-navy dark:text-white hover:border-amber"
        }`}
      >
        {state === "playing" ? (
          <Pause size={13} />
        ) : (
          <Play size={13} />
        )}
        {state === "playing" ? "Pause" : state === "paused" ? "Resume" : "Listen"}
      </button>

      {active && (
        <>
          <div className="inline-flex items-center rounded-full bg-white dark:bg-ink-2 border border-border overflow-hidden">
            {RATES.map((r) => (
              <button
                key={r}
                type="button"
                aria-label={`Speed ${r}x`}
                onClick={() => setRate(r)}
                className={`px-2.5 py-1.5 text-[10px] font-bold cursor-pointer transition-colors font-sans ${
                  rate === r ? "bg-navy text-white" : "text-gray hover:text-navy"
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Stop reading"
            onClick={stop}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-gray bg-white dark:bg-ink-2 border border-border cursor-pointer hover:text-red transition-colors font-sans"
          >
            <Square size={11} /> Stop
          </button>
        </>
      )}
    </div>
  );
}