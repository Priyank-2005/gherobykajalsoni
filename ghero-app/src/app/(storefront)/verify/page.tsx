"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";

export default function VerifyPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-ivory">
      <div className="max-w-md w-full space-y-8 bg-white p-10 shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="font-heading text-3xl text-charcoal mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-500 font-body text-sm">
            We&apos;ve sent a 6-digit code to your@email.com
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="flex justify-center gap-2 sm:gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => { inputRefs.current[index] = el; }}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 border border-gray-300 text-center text-xl font-heading text-charcoal focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine bg-transparent"
              />
            ))}
          </div>

          <div>
            <Link
              href="/account"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-body font-medium text-white bg-wine hover:bg-wine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine transition-colors"
            >
              Verify
            </Link>
          </div>
        </form>

        <div className="text-center mt-6 space-y-3 font-body text-sm">
          <p className="text-gray-500">
            Didn&apos;t receive the code?{" "}
            {timeLeft > 0 ? (
              <span className="text-gray-400">Resend in {timeLeft}s</span>
            ) : (
              <button
                onClick={() => setTimeLeft(30)}
                className="text-wine hover:underline focus:outline-none"
              >
                Resend OTP
              </button>
            )}
          </p>
          <p>
            <Link href="/login" className="text-gray-500 hover:text-wine underline">
              Change email address
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
