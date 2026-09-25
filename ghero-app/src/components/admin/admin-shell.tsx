"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderTree,
  Users,
  TicketPercent,
  Home,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
];

export function AdminShell({ user, children }: { user: { name: string | null; email: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // Drawer is tied to the page it was opened on, so navigating closes it.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const drawerOpen = openedAt === pathname;

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  };

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
              active ? "bg-wine text-white" : "text-gray-600 hover:bg-gray-100 hover:text-charcoal"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-gray-200 pt-4 space-y-1">
      <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-charcoal rounded-md hover:bg-gray-100">
        <ExternalLink className="w-4 h-4" /> View store
      </Link>
      <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
      <p className="px-3 pt-2 text-xs text-gray-400 truncate" title={user.email}>
        {user.name ?? user.email}
      </p>
    </div>
  );

  const brand = (
    <Link href="/admin" className="block px-3">
      <span className="font-heading text-2xl text-gold">Ghero</span>
      <span className="block text-[9px] uppercase tracking-[0.25em] text-gold/80">Admin</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-charcoal">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r border-gray-200 p-4 gap-6">
        {brand}
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {footer}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-4 h-14">
        <button onClick={() => setOpenedAt(pathname)} aria-label="Open menu" className="p-1 -ml-1">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-heading text-xl text-gold">Ghero Admin</span>
        <span className="w-6" />
      </header>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenedAt(null)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white p-4 flex flex-col gap-6 shadow-xl">
            <div className="flex items-center justify-between">
              {brand}
              <button onClick={() => setOpenedAt(null)} aria-label="Close menu" className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            {footer}
          </div>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
