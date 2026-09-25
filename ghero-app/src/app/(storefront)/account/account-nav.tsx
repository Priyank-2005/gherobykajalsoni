"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Package, MapPin, LogOut } from "lucide-react";
import { useStore } from "@/components/storefront/store-provider";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const NAV = [
  { name: "My Orders", href: "/account/orders", icon: Package },
  { name: "My Profile", href: "/account/profile", icon: User },
  { name: "Saved Addresses", href: "/account/addresses", icon: MapPin },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser } = useStore();
  const [leaving, setLeaving] = useState(false);

  const logout = async () => {
    setLeaving(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <nav aria-label="Account" className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-4 md:pb-0 hide-scrollbar">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm rounded-sm whitespace-nowrap transition-colors",
              active ? "bg-cream text-wine font-medium" : "text-gray-600 hover:bg-cream hover:text-wine"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        );
      })}
      <button
        onClick={logout}
        disabled={leaving}
        className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-sm whitespace-nowrap transition-colors md:mt-2 disabled:opacity-50"
      >
        <LogOut className="w-5 h-5" />
        {leaving ? "Signing out…" : "Sign out"}
      </button>
    </nav>
  );
}
