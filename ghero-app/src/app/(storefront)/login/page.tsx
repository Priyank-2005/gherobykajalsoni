import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginFlow } from "./login-flow";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/** Only allow same-site relative redirects (no //evil.com or absolute URLs). */
function safeNext(next: unknown) {
  return typeof next === "string" && /^\/(?!\/)/.test(next) ? next : "/account";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 shadow-sm border border-gold/10">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-2">Welcome to Ghero</h1>
          <p className="text-gray-500 text-sm">Sign in or create an account with a one-time code. No password needed.</p>
        </div>
        <LoginFlow next={next} />
      </div>
    </div>
  );
}
