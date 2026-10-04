"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface StandaloneNavigator extends Navigator {
  standalone?: boolean;
}

const DISMISS_KEY = "klagon:install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as StandaloneNavigator).standalone === true
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setDeferred(null);
  };

  const install = async () => {
    if (!deferred) {
      window.localStorage.setItem(DISMISS_KEY, "1");
      setVisible(false);
      return;
    }
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install KLAGON.org"
      className="fixed inset-x-3 z-40 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-5 sm:max-w-sm sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"
    >
      <div className="rounded-2xl border border-border bg-white shadow-xl p-4 flex items-start gap-3 dark:bg-ink-2 dark:border-white/10">
        {/* Plain <img>, not next/image: `output: "export"` ships no
            /_next/image optimizer, so next/image emits a URL that 404s and the
            icon never decodes. See SponsorStrip.tsx for the same constraint. */}
        <img
          src="/icon-192.png"
          alt=""
          width={44}
          height={44}
          decoding="async"
          className="h-11 w-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy dark:text-white">
            Add KLAGON to your home screen
          </p>
          <p className="mt-0.5 text-xs text-gray dark:text-white/70">
            Opens full screen, loads faster, and works on a weak connection.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={install}>
              <Download size={14} aria-hidden />
              Install
            </Button>
            <Button size="sm" variant="secondary" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 -mt-1 -mr-1 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-gray hover:bg-light cursor-pointer dark:text-white/60 dark:hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}