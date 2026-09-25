import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getProfile } from "@/lib/services/user.service";
import { formatDate, formatPrice } from "@/lib/utils";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const { user } = await requireAuth();
  const profile = await getProfile(user.id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Orders", value: profile.totalOrders.toString() },
          { label: "Total spent", value: formatPrice(profile.totalSpent) },
          { label: "Member since", value: formatDate(profile.createdAt) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gold/10 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">{s.label}</p>
            <p className="font-heading text-2xl text-charcoal mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <ProfileForm profile={{ name: profile.name ?? "", phone: profile.phone ?? "", email: profile.email }} />
    </div>
  );
}
