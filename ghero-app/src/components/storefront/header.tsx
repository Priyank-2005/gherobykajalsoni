"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const dummyCategories = [
  { id: '1', name: 'Sarees', slug: 'sarees' },
  { id: '2', name: 'Lehengas', slug: 'lehengas' },
  { id: '3', name: 'Kurtis', slug: 'kurtis' },
  { id: '4', name: 'Anarkalis', slug: 'anarkalis' },
  { id: '5', name: 'Suits', slug: 'suits' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
            className="md:hidden text-gold p-1"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo — gold color */}
          <Link href="/" className="flex flex-col items-center md:items-start group md:w-1/4">
            <h1 className="font-heading text-3xl md:text-4xl text-gold tracking-wide group-hover:text-gold-dark transition-colors">
              Ghero
            </h1>
            <span className="text-[9px] uppercase tracking-[0.2em] text-gold/70">
              by Kajal Soni
            </span>
          </Link>

          {/* Desktop Navigation — gold text */}
          <nav className="hidden md:flex items-center justify-center space-x-8 md:w-2/4">
            <Link href="/shop" className="text-sm font-medium text-gold hover:text-wine transition-colors uppercase tracking-wider">
              Shop
            </Link>
            {dummyCategories.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/category/${cat.slug}`}
                className="text-sm font-medium text-gold hover:text-wine transition-colors uppercase tracking-wider"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Right Icons — gold */}
          <div className="flex items-center justify-end space-x-4 md:space-x-6 md:w-1/4">
            <Link href="/search" className="text-gold hover:text-wine transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/account" className="hidden md:block text-gold hover:text-wine transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/cart" className="relative text-gold hover:text-wine transition-colors group">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-wine text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
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
              className="fixed inset-0 bg-charcoal/40 z-50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-baby-pink-light z-50 shadow-xl md:hidden flex flex-col"
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
                  {dummyCategories.map((cat) => (
                    <Link 
                      key={cat.id} 
                      href={`/category/${cat.slug}`}
                      className="text-lg font-medium text-gold font-heading hover:text-wine"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="p-5 border-t border-gold/20">
                <Link href="/account" className="flex items-center gap-3 text-gold font-medium hover:text-wine">
                  <User className="w-5 h-5" />
                  My Account
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
