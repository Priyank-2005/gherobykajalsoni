"use client";

import React from "react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-ivory">
      <div className="max-w-md w-full space-y-8 bg-white p-10 shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="font-heading text-3xl md:text-4xl text-charcoal mb-2">
            Welcome to Ghero
          </h2>
          <p className="text-gray-500 font-body text-sm">
            Enter your email to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-charcoal focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine sm:text-sm font-body bg-transparent"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <Link
              href="/verify"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-body font-medium text-white bg-wine hover:bg-wine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine transition-colors"
            >
              Send OTP
            </Link>
          </div>
        </form>
        <div className="text-center mt-6">
          <Link
            href="/shop"
            className="text-sm font-body text-gray-500 hover:text-wine underline transition-colors"
          >
            Continue as guest
          </Link>
        </div>
      </div>
    </div>
  );
}
