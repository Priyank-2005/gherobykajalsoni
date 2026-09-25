"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from './store-provider';
import type { CategoryWithSubcategories } from '@/types/product';

export function Header({ categories }: { categories: CategoryWithSubcategories[] }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { user, cartCount } = useStore();
  // The drawer is open only for the page it was opened on, so navigating closes it
  // without a setState-in-effect.
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null);
  const mobileMenuOpen = menuOpenedAt === pathname;
  const setMobileMenuOpen = (open: boolean) => setMenuOpenedAt(open ? pathname : null);
  const accountHref = user ? '/account' : '/login';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top announcement bar — gold background, white text */}
      <div className="bg-gold text-white text-[11px] md:text-xs font-body text-center py-2 px-4 tracking-wide uppercase">
        Free shipping on all orders over ₹5,000 | Premium Traditional Clothing
      </div>
      
      {/* Main header — baby pink bg with gold text */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 font-body bg-baby-pink-light/95 backdrop-blur-md",
          isScrolled ? "shadow-sm py-3" : "py-5"
        )}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          
          {/* Mobile Menu Button */}
          <button 
            className="xl:hidden text-gold p-1"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo — gold color */}
          <Link href="/" className="flex flex-col items-center xl:items-start group shrink-0">
            <h1 className="font-heading text-3xl xl:text-4xl text-gold tracking-wide group-hover:text-gold-dark transition-colors">
              Ghero
            </h1>
            <span className="text-[9px] uppercase tracking-[0.2em] text-gold/70">
              by Kajal Soni
            </span>
          </Link>

          {/* Desktop Navigation — inline with logo; subcategories in hover dropdown. Below xl the 6 categories don't fit, so the drawer is used. */}
          <nav className="hidden xl:flex flex-1 items-center justify-center gap-x-6 2xl:gap-x-8 px-6">
            <Link href="/shop" className="text-sm font-medium text-gold hover:text-wine transition-colors uppercase tracking-wider whitespace-nowrap">
              Shop
            </Link>
            {categories.map((cat) => (
              <div key={cat.id} className="relative group">
                <Link
                  href={`/category/${cat.slug}`}
                  aria-haspopup={cat.subcategories.length > 0 ? 'true' : undefined}
                  className="flex items-center gap-1 py-2 text-sm font-medium text-gold hover:text-wine group-hover:text-wine transition-colors uppercase tracking-wider whitespace-nowrap"
                >
                  {cat.name}
                  {cat.subcategories.length > 0 && (
                    <ChevronDown
                      aria-hidden
                      className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                    />
                  )}
                </Link>
                {cat.subcategories.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-200">
                    <ul className="min-w-[200px] bg-baby-pink-light border border-gold/20 shadow-lg rounded-md py-2">
                      {cat.subcategories.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/category/${cat.slug}?sub=${sub.slug}`}
                            className="block px-4 py-2 text-sm text-charcoal/80 hover:text-wine hover:bg-baby-pink transition-colors whitespace-nowrap"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </nav>
          {/* Right Icons — gold */}
          <div className="flex items-center justify-end space-x-4 xl:space-x-6 shrink-0">
            <Link href="/search" className="text-gold hover:text-wine transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <Link href={accountHref} aria-label={user ? 'My account' : 'Sign in'} className="hidden xl:block text-gold hover:text-wine transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link
              href="/cart"
              aria-label={`Shopping bag${cartCount ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
              className="relative text-gold hover:text-wine transition-colors group"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-wine text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

      </header>

      {/* Mobile Drawer — baby pink bg with gold text */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-charcoal/40 z-50 backdrop-blur-sm xl:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-baby-pink-light z-50 shadow-xl xl:hidden flex flex-col"
            >
              <div className="p-5 flex items-center justify-between border-b border-gold/20">
                <Link href="/" className="flex flex-col items-start" onClick={() => setMobileMenuOpen(false)}>
                  <h2 className="font-heading text-2xl text-gold">Ghero</h2>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gold p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <nav className="flex flex-col space-y-6">
                  <Link href="/shop" className="text-lg font-medium text-gold font-heading hover:text-wine">
                    Shop All
                  </Link>
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className="text-lg font-medium text-gold font-heading hover:text-wine"
                      >
                        {cat.name}
                      </Link>
                      {cat.subcategories.length > 0 && (
                        <ul className="mt-2 ml-3 pl-3 border-l border-gold/20 space-y-2">
                          {cat.subcategories.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={`/category/${cat.slug}?sub=${sub.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-sm text-charcoal/70 hover:text-wine"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
              <div className="p-5 border-t border-gold/20">
                <Link href={accountHref} className="flex items-center gap-3 text-gold font-medium hover:text-wine">
                  <User className="w-5 h-5" />
                  {user ? 'My Account' : 'Sign In'}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
