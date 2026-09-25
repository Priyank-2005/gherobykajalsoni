import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

function safeNext(next: unknown) {
  return typeof next === "string" && /^\/admin(\/|$|\?)/.test(next) ? next : "/admin";
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const session = await getSession();
  if (session?.user.role === "ADMIN") redirect(next);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-heading text-4xl text-gold">Ghero</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold/80">Admin</p>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm p-8">
          <h1 className="font-heading text-2xl text-charcoal mb-6">Sign in</h1>
          {session && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 mb-4">
              You&apos;re signed in as a customer ({session.user.email}). Sign in with the admin account to continue.
            </p>
          )}
          <AdminLoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
