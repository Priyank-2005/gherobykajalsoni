import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AccountNav } from "./account-nav";

/** Real session check (proxy.ts only does a fast cookie-presence redirect). */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-2">My Account</h1>
      <p className="text-gray-500 mb-8">
        Hello{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}! <span className="break-all">{session.user.email}</span>
      </p>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <aside className="w-full md:w-64 flex-shrink-0">
          <AccountNav />
        </aside>
        <div className="flex-grow min-w-0">{children}</div>
      </div>
    </div>
  );
}
