"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { SizeSelector } from "./size-selector";
import { ColorSelector } from "./color-selector";
import { QuantitySelector } from "./quantity-selector";
import { useStore } from "./store-provider";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/api-client";
import { calculateDiscount, cn, formatPrice } from "@/lib/utils";
import type { ProductVariantInfo } from "@/types/product";

const MAX_PER_ITEM = 10;
const inStock = (v: ProductVariantInfo) => v.isAvailable && v.stock > 0;

/**
 * Variant selection + price + stock + add to cart / buy now.
 * Colour is chosen first; sizes not stocked in that colour are shown disabled.
 * Prices shown here are display-only: the server re-prices everything in the cart.
 */
export function ProductPurchase({ productName, variants }: { productName: string; variants: ProductVariantInfo[] }) {
  const router = useRouter();
  const toast = useToast();
  const { addToCart } = useStore();

  const firstInStock = variants.find(inStock) ?? variants[0];
  const [color, setColor] = useState(firstInStock?.color ?? "");
  const [size, setSize] = useState(firstInStock?.size ?? "");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [added, setAdded] = useState(false);

  const colors = [...new Map(variants.filter((v) => v.color).map((v) => [v.color!, v.colorHex || "#cccccc"]))].map(([name, hex]) => ({ name, hex }));
  const sizes = [...new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))];
  const forColor = colors.length ? variants.filter((v) => v.color === color) : variants;
  const unavailableSizes = sizes.filter((s) => !forColor.some((v) => v.size === s && inStock(v)));

  const selected =
    variants.find((v) => (colors.length ? v.color === color : true) && (sizes.length ? v.size === size : true)) ?? null;
  const available = selected ? inStock(selected) : false;
  const maxQty = selected ? Math.max(1, Math.min(selected.stock, MAX_PER_ITEM)) : 1;

  const chooseColor = (c: string) => {
    setColor(c);
    // Keep the size if it exists in the new colour, else pick its first in-stock size.
    const options = variants.filter((v) => v.color === c);
    if (!options.some((v) => v.size === size && inStock(v))) setSize(options.find(inStock)?.size ?? options[0]?.size ?? "");
    setQuantity(1);
  };

  const submit = async (mode: "cart" | "buy") => {
    if (!selected || !available) return;
    setBusy(mode);
    try {
      await addToCart(selected.id, Math.min(quantity, maxQty));
      if (mode === "buy") {
        router.push("/checkout");
        return;
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      toast(`${productName}${selected.size ? ` (${selected.size})` : ""} added to your bag`);
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusy(null);
    }
  };

  const price = selected?.price ?? 0;
  const mrp = selected?.mrp ?? 0;
  const discount = calculateDiscount(mrp, price);

  return (
    <div>
      {selected && (
        <p className="text-sm text-gray-400 mb-6 font-mono">SKU: {selected.sku}</p>
      )}

      <div className="flex items-end gap-4 mb-8 flex-wrap">
        <span className="text-2xl font-medium text-charcoal">{formatPrice(price)}</span>
        {mrp > price && (
          <>
            <span className="text-lg text-gray-400 line-through mb-0.5">{formatPrice(mrp)}</span>
            <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded mb-1">{discount}% OFF</span>
          </>
        )}
        <span className="basis-full text-xs text-gray-500">Inclusive of all taxes</span>
      </div>

      <div className="w-full h-px bg-gold/20 mb-8" />

      {colors.length > 0 && (
        <div className="mb-8">
          <span className="text-sm font-medium text-charcoal block mb-3">Colour: {color}</span>
          <ColorSelector colors={colors} selectedColor={color} onSelect={chooseColor} />
        </div>
      )}

      {sizes.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-charcoal">Size: {size}</span>
            <a href="#size-guide" className="text-sm text-gray-500 underline hover:text-wine">
              Size Guide
            </a>
          </div>
          <SizeSelector
            sizes={sizes}
            selectedSize={size}
            unavailable={unavailableSizes}
            onSelect={(s) => {
              setSize(s);
              setQuantity(1);
            }}
          />
        </div>
      )}

      {available && (
        <div className="mb-8">
          <span className="text-sm font-medium text-charcoal block mb-3">Quantity</span>
          <QuantitySelector quantity={quantity} onChange={setQuantity} max={maxQty} />
        </div>
      )}

      <div className="mb-8 flex items-center gap-2" aria-live="polite">
        <span className={cn("w-2 h-2 rounded-full", !available ? "bg-red-500" : selected!.stock > 5 ? "bg-green-500" : "bg-amber-500")} />
        <span className={cn("text-sm", !available ? "text-red-600" : selected!.stock > 5 ? "text-green-700" : "text-amber-700")}>
          {!selected ? "Please choose an option" : !available ? "Out of stock" : selected.stock > 5 ? "In stock" : `Only ${selected.stock} left in stock`}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <button
          onClick={() => submit("cart")}
          disabled={!available || busy !== null}
          className="flex-1 h-14 bg-white border-2 border-charcoal text-charcoal font-medium text-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {added ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
          {busy === "cart" ? "Adding…" : added ? "Added" : "Add to Bag"}
        </button>
        <button
          onClick={() => submit("buy")}
          disabled={!available || busy !== null}
          className="flex-1 h-14 bg-wine text-white font-medium text-lg hover:bg-wine/90 transition-colors shadow-lg shadow-wine/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === "buy" ? "Please wait…" : "Buy Now"}
        </button>
      </div>
    </div>
  );
}
