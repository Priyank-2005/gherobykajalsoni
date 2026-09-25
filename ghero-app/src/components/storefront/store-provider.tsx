"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { ToastProvider } from "@/components/ui/toast";
import type { CartResponse } from "@/types/cart";
import type { UserPublic } from "@/types/user";

interface StoreContextValue {
  user: UserPublic | null;
  setUser: (user: UserPublic | null) => void;
  cart: CartResponse | null;
  cartCount: number;
  refreshCart: () => Promise<CartResponse>;
  addToCart: (variantId: string, quantity: number) => Promise<CartResponse>;
  updateCartItem: (itemId: string, quantity: number) => Promise<CartResponse>;
  removeCartItem: (itemId: string) => Promise<CartResponse>;
  applyCoupon: (code: string) => Promise<CartResponse>;
  removeCoupon: () => Promise<CartResponse>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/**
 * Client state shared across the storefront: the signed-in user (seeded by the server
 * layout) and the cart (fetched once, then replaced by every mutation's response, which
 * is always server-priced).
 */
export function StoreProvider({ initialUser, children }: { initialUser: UserPublic | null; children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(initialUser);
  const [cart, setCart] = useState<CartResponse | null>(null);

  const run = useCallback(async (p: Promise<CartResponse>) => {
    const next = await p;
    setCart(next);
    return next;
  }, []);

  const refreshCart = useCallback(() => run(api<CartResponse>("/api/cart")), [run]);

  const userId = user?.id;
  useEffect(() => {
    // Re-fetch when the user changes: sign-in merges the guest bag server-side.
    let cancelled = false;
    api<CartResponse>("/api/cart")
      .then((next) => {
        if (!cancelled) setCart(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const value = useMemo<StoreContextValue>(
    () => ({
      user,
      setUser,
      cart,
      cartCount: cart ? cart.items.reduce((n, i) => n + i.quantity, 0) : 0,
      refreshCart,
      addToCart: (variantId, quantity) => run(api("/api/cart/add", { body: { variantId, quantity } })),
      updateCartItem: (itemId, quantity) => run(api("/api/cart/update", { method: "PUT", body: { itemId, quantity } })),
      removeCartItem: (itemId) => run(api("/api/cart/remove", { method: "DELETE", body: { itemId } })),
      applyCoupon: (code) => run(api("/api/cart/coupon", { body: { code } })),
      removeCoupon: () => run(api("/api/cart/coupon", { method: "DELETE" })),
    }),
    [user, cart, refreshCart, run]
  );

  return (
    <StoreContext.Provider value={value}>
      <ToastProvider>{children}</ToastProvider>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
