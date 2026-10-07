"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CONSENT_CHANNELS,
  CONSENT_TEXT_VERSION,
  channelList,
  type MarketingChannel,
} from "@/lib/consent";
import { cn } from "@/lib/utils";

interface ConsentBoxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The channels this form will actually use. Never list one we do not send on. */
  channels?: readonly MarketingChannel[];
  /** What they will receive: "monthly news and program updates". */
  purpose: string;
  /** For forms where consent is the point of the interaction, not an aside. */
  required?: boolean;
  error?: string | null;
  variant?: "light" | "dark";
  /** Form source recorded with the ledger row: "footer", "contact-form". */
  formSource: string;
  className?: string;
  children?: ReactNode;
}

/**
 * The one opt-in box used everywhere a visitor hands over contact details.
 *
 * Deliberate properties, each of which would be easy to get wrong:
 *
 * - It starts unticked. Nothing pre-ticks it, including reading it as accepted.
 * - The wording names the specific channels rather than a vague "updates", so
 *   consent is specific to email / SMS / WhatsApp rather than a blanket.
 * - It is a standalone control. Callers must not fold it into a Terms
 *   acceptance — bundling consent with something else is not freely given.
 * - The Privacy Policy link does not tick the box. Tapping it to read it would
 *   otherwise silently record permission the visitor never granted.
 * - The version is rendered as a data attribute so the wording on screen and
 *   the `consent_text_version` stored in the ledger can be compared later.
 */
export function ConsentBox({
  checked,
  onChange,
  channels = CONSENT_CHANNELS,
  purpose,
  required = false,
  error = null,
  variant = "light",
  formSource,
  className,
  children,
}: ConsentBoxProps) {
  const dark = variant === "dark";
  const id = `consent-${formSource}`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-start gap-2.5",
          dark ? "text-white/70" : "text-gray",
        )}
        data-consent-version={CONSENT_TEXT_VERSION}
        data-consent-channels={channels.join(",")}
        data-consent-source={formSource}
        data-testid={`consent-box-${formSource}`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#1A2E8C]"
        />
        <span className={cn("text-xs leading-relaxed", dark ? "text-white/70" : "text-gray")}>
          I agree to receive marketing by {channelList(channels)} from KLAGON.org — {purpose}.
          I can opt out at any time. Read our{" "}
          {/* stopPropagation: following this link must not tick the box. A visitor
              who opens the policy to decide has not yet decided. */}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn("font-bold hover:underline", dark ? "text-blue" : "text-blue")}
          >
            Privacy Policy
          </Link>
          .
          {children}
        </span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-red">
          {error}
        </p>
      )}
    </div>
  );
}
