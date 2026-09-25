import React from "react";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { StoreProvider } from "@/components/storefront/store-provider";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/services/category.service";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [session, categories] = await Promise.all([getSession(), listCategories()]);

  return (
    <StoreProvider initialUser={session?.user ?? null}>
      <div className="min-h-screen flex flex-col bg-baby-pink-light">
        <Header categories={categories} />
        <main className="flex-1 w-full flex flex-col">{children}</main>
        <Footer categories={categories} />
      </div>
    </StoreProvider>
  );
}
