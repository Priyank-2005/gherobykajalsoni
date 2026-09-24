export const dynamic = "force-dynamic";
import React from "react";
import Link from "next/link";
import { User, Package, MapPin, LogOut } from "lucide-react";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { name: "My Profile", href: "/account/profile", icon: User },
    { name: "My Orders", href: "/account/orders", icon: Package },
    { name: "Saved Addresses", href: "/account/addresses", icon: MapPin },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-8">
        My Account
      </h1>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-4 md:pb-0 hide-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm font-body text-gray-600 hover:bg-cream hover:text-wine rounded-sm whitespace-nowrap transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <Link
              href="/login"
              className="flex items-center gap-3 px-4 py-3 text-sm font-body text-red-500 hover:bg-red-50 rounded-sm whitespace-nowrap transition-colors mt-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}
