"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/feedback";
import { formatPrice } from "@/lib/utils";

type Suggestions = {
  products: { name: string; slug: string; price: number; imageUrl: string | null }[];
  categories: { label: string; href: string }[];
};

/**
 * Search input with debounced autocomplete (products + categories/subcategories).
 * Keyboard: ↑/↓ to move, Enter to open the highlighted suggestion or search, Esc to close.
 */
export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState(initialQuery);
  const [data, setData] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?suggest=1&q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setData(await res.json());
      } catch {
        /* aborted or offline: keep previous suggestions */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const options = [
    ...(data?.categories ?? []).map((c) => ({ key: `c-${c.href}`, href: c.href, label: c.label, product: null })),
    ...(data?.products ?? []).map((p) => ({ key: `p-${p.slug}`, href: `/product/${p.slug}`, label: p.name, product: p })),
  ];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const submit = () => {
    if (active >= 0 && options[active]) return go(options[active].href);
    const term = q.trim();
    if (term) go(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-2xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden />
        <input
          type="search"
          value={q}
          autoFocus={!initialQuery}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Search sarees, lehengas, jewellery…"
          aria-label="Search products"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className="w-full h-14 pl-12 pr-24 bg-white border border-gray-200 text-charcoal text-base focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Spinner className="w-4 h-4" label="Searching" />}
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="p-1 text-gray-400 hover:text-charcoal">
              <X className="w-4 h-4" />
            </button>
          )}
          <button type="submit" className="px-3 py-1.5 bg-wine text-white text-xs uppercase tracking-wider">
            Search
          </button>
        </div>
      </form>

      {open && q.trim().length >= 2 && data && (
        <ul id={listId} role="listbox" className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-100 shadow-lg max-h-[60vh] overflow-y-auto">
          {options.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">No matches for “{q.trim()}”</li>}
          {options.map((o, i) => (
            <li
              key={o.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(o.href);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm ${i === active ? "bg-baby-pink-light" : ""}`}
            >
              {o.product ? (
                <>
                  <div className="relative w-10 h-12 shrink-0 bg-baby-pink">
                    {o.product.imageUrl && <Image src={o.product.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
                  </div>
                  <span className="flex-1 text-charcoal line-clamp-1">{o.label}</span>
                  <span className="text-wine font-medium">{formatPrice(o.product.price)}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-gold shrink-0" aria-hidden />
                  <span className="text-charcoal">{o.label}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
