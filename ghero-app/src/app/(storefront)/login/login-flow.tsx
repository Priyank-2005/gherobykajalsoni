"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OtpSignIn } from "@/components/storefront/otp-sign-in";
import { useStore } from "@/components/storefront/store-provider";

export function LoginFlow({ next }: { next: string }) {
  const router = useRouter();
  const { setUser } = useStore();

  return (
    <>
      <OtpSignIn
        onVerified={(user) => {
          setUser(user);
          router.replace(next);
          router.refresh(); // re-render server components (layout, account) with the new session
        }}
      />
      <div className="text-center mt-8">
        <Link href="/shop" className="text-sm text-gray-500 hover:text-wine underline transition-colors">
          Continue shopping as guest
        </Link>
      </div>
    </>
  );
}
