"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api-client";
import type { UserPublic } from "@/types/user";

type SendResponse = { isNewUser: boolean; resendAfterSeconds: number; expiresInSeconds: number };

interface OtpSignInProps {
  onVerified: (user: UserPublic, isNewUser: boolean) => void;
  initialEmail?: string;
  /** Checkout passes the details already typed so a new account is created with them. */
  profile?: { name?: string; phone?: string };
  /** Hide the email step's own input (checkout collects the email in its form). */
  emailLocked?: boolean;
  submitLabel?: string;
}

/**
 * Email OTP sign-in: send code → enter 6 digits (paste-friendly) → verified.
 * Resend is disabled for the server's cooldown; server errors are shown inline.
 */
export function OtpSignIn({ onVerified, initialEmail = "", profile, emailLocked = false, submitLabel = "Send code" }: OtpSignInProps) {
  const [typedEmail, setEmail] = useState(initialEmail);
  const email = emailLocked ? initialEmail : typedEmail;
  const [step, setStep] = useState<"email" | "code">("email");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<SendResponse>("/api/auth/send-otp", { body: { email } });
      setStep("code");
      setDigits(Array(6).fill(""));
      setCooldown(res.resendAfterSeconds);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (code: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ user: UserPublic; isNewUser: boolean }>("/api/auth/verify-otp", {
        body: { email, otp: code, ...(profile?.name ? { name: profile.name } : {}), ...(profile?.phone ? { phone: profile.phone } : {}) },
      });
      onVerified(res.user, res.isNewUser);
    } catch (e) {
      setError(errorMessage(e));
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (i: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      // Pasted or autofilled the whole code.
      const next = clean.slice(0, 6).split("");
      const filled = [...next, ...Array(6 - next.length).fill("")];
      setDigits(filled);
      if (next.length === 6) verify(next.join(""));
      else inputs.current[next.length]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) inputs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(""));
  };

  if (step === "email") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="space-y-4"
      >
        {!emailLocked && (
          <div>
            <label htmlFor="otp-email" className="block text-sm text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="otp-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 text-charcoal focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white"
              placeholder="you@example.com"
            />
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth size="lg" isLoading={busy} disabled={!email}>
          {submitLabel}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        We&apos;ve sent a 6-digit code to <b className="text-charcoal break-all">{email}</b>. It expires in 5 minutes.
      </p>
      <fieldset>
        <legend className="sr-only">Verification code</legend>
        <div className="flex justify-between gap-2 max-w-xs">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={i === 0 ? 6 : 1}
              aria-label={`Digit ${i + 1}`}
              disabled={busy}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
              }}
              className="w-11 h-13 sm:w-12 sm:h-14 border border-gray-300 text-center text-xl font-heading text-charcoal focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-white disabled:opacity-60"
            />
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button fullWidth size="lg" isLoading={busy} disabled={digits.some((d) => !d)} onClick={() => verify(digits.join(""))}>
        Verify
      </Button>
      <div className="flex items-center justify-between text-sm">
        {cooldown > 0 ? (
          <span className="text-gray-400">Resend code in {cooldown}s</span>
        ) : (
          <button onClick={send} disabled={busy} className="text-wine hover:underline">
            Resend code
          </button>
        )}
        <button
          onClick={() => {
            setStep("email");
            setError(null);
          }}
          className="text-gray-500 hover:text-wine underline"
        >
          {emailLocked ? "Edit email" : "Change email"}
        </button>
      </div>
    </div>
  );
}
