import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/toast";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Ghero Admin" },
  robots: { index: false, follow: false },
};

/** Server-side role check for every admin page (proxy.ts only checks the cookie exists). */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/admin/login");

  return (
    <ToastProvider>
      <AdminShell user={{ name: session.user.name, email: session.user.email }}>{children}</AdminShell>
    </ToastProvider>
  );
}
