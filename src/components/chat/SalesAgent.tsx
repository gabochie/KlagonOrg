"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Mic, MicOff, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getInvisibleToken, verifyTurnstile } from "@/lib/turnstile";
import {
  createRecognition,
  recognitionSupported,
  speechSupported,
  speak,
  stopSpeaking,
  splitSentences,
} from "@/lib/voice";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface LeadIntent {
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface TurnResult {
  reply?: string;
  intent?: LeadIntent | null;
  saved?: boolean;
  error?: string;
}

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "";
const CONSENT_KEY = "klagon-agent-voice-ok";

const readVoicePref = (): boolean => {
  try {
    return localStorage.getItem(CONSENT_KEY) === "on";
  } catch {
    return false;
  }
};

const PROSPECT_REPLIES = ["How do I join?", "Is it really free?", "When is the next event?", "What courses can I take?", "How do I donate?"];
const MEMBER_REPLIES = ["What events are coming up?", "Suggest a course for me", "How do I volunteer?", "Where is the community center?"];

let idSeq = 0;
const nid = () => `m${Date.now()}-${idSeq++}`;

export function SalesAgent() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nid(),
      role: "assistant",
      text: "Hey there! 👋 I'm Ama, KLAGON.org's AI assistant. I can tell you about joining, events, courses, and volunteering — just ask, or tap the mic to talk to me.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState<boolean>(() => readVoicePref());
  const [askConsent, setAskConsent] = useState(false);
  const [pendingLead, setPendingLead] = useState<LeadIntent | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const lastInputViaVoice = useRef(false);
  const isApproved = profile?.status === "approved";

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      recRef.current?.abort();
    };
  }, []);

  const speakReply = useCallback(
    (text: string) => {
      if (!voiceOn || !speechSupported()) return;
      const plain = text.replace(/[✅📚🎉🌟👋🧠💡🤝✨🔥💬]/g, "").trim();
      if (!plain) return;
      const sentences = splitSentences(plain);
      if (sentences.length === 0) return;
      let i = 0;
      const next = () => {
        if (i >= sentences.length) return;
        speak(sentences[i++], { onEnd: next });
      };
      next();
    },
    [voiceOn]
  );

  const callTurn = useCallback(
    async (payload: unknown): Promise<TurnResult> => {
      if (!AGENT_URL) return { reply: undefined, error: "Agent is not configured yet." };
      let token: string;
      try {
        token = await getInvisibleToken();
      } catch {
        return { reply: undefined, error: "Could not complete the human check. Please try again." };
      }
      const human = await verifyTurnstile(token);
      if (!human.success) {
        return { reply: undefined, error: human.error ?? "Could not verify you're human. Please refresh and try again." };
      }
      const res = await fetch(`${AGENT_URL}/api/agent/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(payload as object), token }),
      });
      if (!res.ok) {
        if (res.status === 403 || res.status === 400) {
          return { reply: undefined, error: "Could not verify you're human. Please refresh and try again." };
        }
        return { reply: undefined, error: "Ama is unavailable right now. Please try again shortly." };
      }
      return (await res.json()) as TurnResult;
    },
    []
  );

  const userOf = () => ({
    name: profile?.full_name ?? null,
    isMember: isApproved,
    id: profile?.id ?? null,
  });

  const afterReply = (reply: string, intent: LeadIntent | null) => {
    setMessages((prev) => [...prev, { id: nid(), role: "assistant", text: reply }]);
    if (intent && (intent.email || intent.phone)) {
      setPendingLead(intent);
      setSavedNote(null);
    }
    speakReply(reply);
  };

  const sendText = useCallback(
    async (raw: string, viaVoice = false) => {
      const text = raw.trim();
      if (!text || typing) return;
      lastInputViaVoice.current = viaVoice;
      stopSpeaking();
      setMessages((prev) => [...prev, { id: nid(), role: "user", text }]);
      setInput("");
      setTyping(true);

      let buffer = "";
      const appendReply = (chunk: string) => {
        buffer += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant" && last.id.endsWith("stream")) {
            return [...copy.slice(0, -1), { ...last, text: buffer }];
          }
          return [...copy, { id: nid() + "-stream", role: "assistant", text: buffer }];
        });
      };

      const context = messages
        .map((m) => ({ role: m.role, content: m.text }))
        .slice(-12);
      context.push({ role: "user", content: text });

      const res = await callTurn({ messages: context, user: userOf(), source: viaVoice ? "voice-agent" : "chat-agent" }).catch(() => ({ reply: undefined, error: "Ama is unavailable right now. Please try again shortly." }) as TurnResult);
      setTyping(false);

      if (res?.error) {
        if (buffer) appendReply(res.error);
        else setMessages((prev) => [...prev, { id: nid(), role: "assistant", text: res.error ?? "" }]);
        return;
      }
      if (res?.reply) afterReply(res.reply, res?.intent ?? null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, typing, callTurn, afterReply, userOf, voiceOn]
  );

  const startListening = useCallback(() => {
    if (!recognitionSupported()) {
      setVoiceOn(false);
      setSavedNote("Voice isn't supported on this browser — just type below.");
      return;
    }
    setAskConsent(false);
    setListening(true);
    const rec = createRecognition({
      onResult: (text, final) => {
        if (final) recRef.current?.stop();
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (!rec) {
      setListening(false);
      return;
    }
    recRef.current = rec;
    rec.start();

    rec.onresult = (e: unknown) => {
      const ev = e as { results?: ArrayLike<ArrayLike<{ transcript?: string }> & { isFinal: boolean }> };
      if (!ev.results) return;
      let interim = "";
      let final = "";
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        const transcript = r[0]?.transcript ?? "";
        if (r.isFinal) final += transcript;
        else interim += transcript;
      }
      const text = final || interim;
      if (text.trim()) {
        setInput(text);
        if (final) void sendText(text, true);
      }
    };
  }, [sendText]);

  const stopListening = () => {
    recRef.current?.abort();
    setListening(false);
  };

  const toggleVoice = () => {
    if (listening) {
      stopListening();
      return;
    }
    stopSpeaking();
    if (!voiceOn && !askConsent) {
      try {
        if (localStorage.getItem(CONSENT_KEY) === "on") {
          setVoiceOn(true);
        } else {
          setAskConsent(true);
          return;
        }
      } catch {
        setAskConsent(true);
        return;
      }
    }
    if (voiceOn) {
      startListening();
    }
  };

  const grantVoice = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "on");
    } catch {
      /* private mode */
    }
    setAskConsent(false);
    setVoiceOn(true);
    startListening();
  };

  const saveLead = async () => {
    if (!pendingLead) return;
    setLeadError(null);
    const res = await callTurn({
      persistLead: {
        ...pendingLead,
        source: lastInputViaVoice.current ? "voice-agent" : "chat-agent",
        profile_id: profile?.id ?? null,
      },
    }).catch(() => ({ reply: undefined, error: "Could not save your details. Please try again." }) as TurnResult);
    if (res?.saved) {
      const who = pendingLead.name ?? "your";
      setSavedNote(`Saved — ${who} details are with the KLAGON.org team.`);
      setPendingLead(null);
    } else {
      setLeadError(res?.error ?? "Could not save your details.");
    }
  };

  const isProspect = !profile || !isApproved;
  const quickReplies = isProspect ? PROSPECT_REPLIES : MEMBER_REPLIES;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-border w-[380px] max-w-[calc(100vw-24px)] flex flex-col overflow-hidden">
          <div className="bg-navy px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-sm">
                🎙️
              </div>
              <div>
                <div className="text-sm font-bold text-white">Ama · KLAGON.org AI Assistant</div>
                <div className="text-[10px] text-white/50 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
                  {voiceOn ? "Voice ready · tap mic to talk" : "Online · typically replies instantly"}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                stopSpeaking();
                recRef.current?.abort();
                setOpen(false);
              }}
              className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center cursor-pointer hover:bg-white/15 transition-colors"
              aria-label="Close chat"
            >
              <ChevronDown size="16" className="text-white/60" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 max-h-[380px] min-h-[220px] bg-light/50"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-navy text-white rounded-tr-md"
                      : "bg-white text-navy border border-border rounded-tl-md shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray/40 typing-dot" />
                    <span className="w-2 h-2 rounded-full bg-gray/40 typing-dot" />
                    <span className="w-2 h-2 rounded-full bg-gray/40 typing-dot" />
                  </div>
                </div>
              </div>
            )}

            {listening && (
              <div className="flex justify-start">
                <div className="bg-blue/10 text-navy border border-blue/20 rounded-2xl rounded-tl-md px-4 py-2.5 text-sm font-semibold">
                  🎙️ Listening… speak now
                </div>
              </div>
            )}

            {pendingLead && (
              <div className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3">
                <div className="text-xs font-extrabold text-navy mb-1">Save your details with KLAGON.org?</div>
                <div className="text-[11px] text-gray leading-relaxed mb-2">
                  Ama can pass {pendingLead.name ? `“${pendingLead.name}”` : "your name"}
                  {pendingLead.email ? ` · ${pendingLead.email}` : ""}
                  {pendingLead.phone ? ` · ${pendingLead.phone}` : ""} to the team so they can follow up.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void saveLead()}
                    className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer font-sans hover:bg-blue transition-colors"
                  >
                    Yes, save
                  </button>
                  <button
                    onClick={() => setPendingLead(null)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-white text-navy text-xs font-semibold cursor-pointer font-sans hover:border-navy transition-colors"
                  >
                    Not now
                  </button>
                </div>
                {leadError && <div className="text-[11px] text-red mt-2">{leadError}</div>}
              </div>
            )}

            {savedNote && (
              <div className="rounded-2xl border border-green/30 bg-green/10 px-4 py-2.5 text-xs font-semibold text-green-800">
                ✓ {savedNote}
              </div>
            )}
          </div>

          {messages.length < 4 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 border-b border-border pt-2">
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  onClick={() => void sendText(qr)}
                  className="px-2.5 py-1 rounded-full bg-pale text-xs font-medium text-navy cursor-pointer hover:bg-amber/10 hover:border-amber transition-colors border border-transparent whitespace-nowrap font-sans"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {askConsent && (
            <div className="px-4 py-3 border-b border-border bg-amber/5">
              <div className="text-xs font-bold text-navy mb-1.5">Let Ama listen and speak?</div>
              <p className="text-[11px] text-gray mb-2">Allow your browser microphone (or type instead — that works too).</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={grantVoice}
                  className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer font-sans hover:bg-blue transition-colors"
                >
                  Allow mic & voice
                </button>
                <button
                  onClick={() => setAskConsent(false)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-white text-navy text-xs font-semibold cursor-pointer font-sans hover:border-navy transition-colors"
                >
                  Type instead
                </button>
              </div>
            </div>
          )}

          <form
            className="flex items-center gap-2 px-3 py-2.5 border-t border-border"
            onSubmit={(e) => {
              e.preventDefault();
              void sendText(input);
            }}
          >
            <button
              type="button"
              onClick={toggleVoice}
              title={recognitionSupported() ? "Talk to Ama" : "Voice not supported here"}
              className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer font-sans transition-colors flex-shrink-0 ${
                listening
                  ? "bg-red text-white animate-pulse"
                  : voiceOn
                    ? "bg-amber text-navy hover:bg-amber/90"
                    : "bg-light text-gray hover:text-navy"
              }`}
              aria-label={listening ? "Stop listening" : "Talk to Ama"}
            >
              {listening ? <MicOff size="15" /> : <Mic size="15" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              className="flex-1 px-3 py-2 rounded-xl bg-light text-sm text-navy placeholder:text-gray/50 font-sans border-none focus:outline-none"
              disabled={typing || listening}
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <Send size="14" className="text-white" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 ${
          open ? "bg-gray-700 rotate-45" : "bg-amber"
        }`}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size="24" className="text-white" /> : <MessageCircle size="24" className="text-navy" />}
      </button>
    </div>
  );
}