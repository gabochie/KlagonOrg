"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";

interface Message {
  role: "bot" | "user";
  text: string;
}

const FAQ: { q: string; a: string }[] = [
  { q: "What is KlagonOrg?", a: "KlagonOrg is a community-based organization in Klagon, Greater Accra, that prepares youth for the future through skills training, mentorship, entrepreneurship, and community projects — all free of charge." },
  { q: "How do I join?", a: "Click the 'Join KlagonOrg' button in the top navigation or visit /auth/register to create your free account. Your account is ready instantly — sign in and start with a course, event, or project." },
  { q: "Is it really free?", a: "Yes! KlagonOrg is 100% free for all youth in Klagon and surrounding communities. There are no fees, no hidden costs, ever." },
  { q: "When is the next event?", a: "Check our Events page at /events for the full calendar. We run workshops, hackathons, leadership sessions, and community service projects every week." },
  { q: "Where is KlagonOrg located?", a: "We operate at the Community Center in Klagon, Greater Accra Region, Ghana. Most events and workshops are held there." },
  { q: "How do I become a mentor?", a: "Visit /mentor to see the mentoring areas we need help with and submit your application. We're always looking for professionals and skilled graduates." },
  { q: "How do I donate or sponsor?", a: "Visit /donate to make a contribution or /sponsor to explore sponsorship tiers. Every cedi creates opportunity for Klagon's youth." },
  { q: "Can I volunteer?", a: "Absolutely! Visit /volunteer to see open roles like Youth Mentor, Event Coordinator, Digital Literacy Tutor, and more." },
  { q: "What learning tracks are available?", a: "We offer courses in AI & Tech, Financial Literacy, Leadership, Entrepreneurship, Communication, and Career Planning. Visit /learning to explore." },
  { q: "How do I contact support?", a: "You can reach us at hello@klagon.org, call or WhatsApp +233 59 562 4456, or visit /contact to send us a message. We respond within 24 hours." },
];

function getBotReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const faq of FAQ) {
    const keywords = faq.q.toLowerCase().replace("?", "").split(" ");
    const matchCount = keywords.filter((k) => k.length > 2 && lower.includes(k)).length;
    if (matchCount >= 2) return faq.a;
  }
  if (lower.includes("hello") || lower.includes("hi ") || lower === "hi" || lower === "hey") {
    return "Hey there! 👋 Welcome to KlagonOrg. I'm your virtual assistant. Ask me about joining, events, volunteering, mentoring, or anything else about the hub!";
  }
  if (lower.includes("thank")) {
    return "You're welcome! 😊 Anything else I can help you with?";
  }
  if (lower.includes("bye") || lower.includes("goodbye")) {
    return "Goodbye! 👋 Feel free to come back anytime you need help. See you at KlagonOrg!";
  }
  return "I'm not sure about that one. Try asking about joining, events, volunteering, mentoring, donating, or learning tracks. Or visit /contact to speak with our team directly.";
}

const QUICK_REPLIES = [
  "How do I join?",
  "When is the next event?",
  "How do I become a mentor?",
  "Is it really free?",
  "How do I donate?",
];

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "👋 Hi! I'm the KlagonOrg assistant. Ask me anything about KlagonOrg — joining, events, volunteering, mentoring, and more!" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim() || typing) return;
    const userText = text.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(userText);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      setTyping(false);
    }, 900);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-border w-[360px] max-w-[calc(100vw-40px)] flex flex-col overflow-hidden animate-fade-in">
          <div className="bg-navy px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center text-[10px] font-extrabold text-navy">
                KY
              </div>
              <div>
                <div className="text-sm font-bold text-white">KlagonOrg Assistant</div>
                <div className="text-[10px] text-white/50">Online · Typically replies instantly</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center cursor-pointer hover:bg-white/15 transition-colors"
              aria-label="Close chat"
            >
              <ChevronDown size="16" className="text-white/60" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 max-h-[360px] min-h-[200px] bg-light/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
          </div>

          {messages.length < 3 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 border-b border-border pt-2">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  className="px-2.5 py-1 rounded-full bg-pale text-xs font-medium text-navy cursor-pointer hover:bg-amber/10 hover:border-amber transition-colors border border-transparent whitespace-nowrap font-sans"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex items-center gap-2 px-3 py-2.5 border-t border-border"
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 rounded-xl bg-light text-sm text-navy placeholder:text-gray/50 font-sans border-none focus:outline-none"
              disabled={typing}
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
