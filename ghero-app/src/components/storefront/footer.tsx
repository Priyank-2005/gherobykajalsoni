import React from 'react';
import Link from 'next/link';
import { ExternalLink, Heart, Mail, Phone } from 'lucide-react';
import type { CategoryWithSubcategories } from '@/types/product';

export function Footer({ categories }: { categories: CategoryWithSubcategories[] }) {
  return (
    <footer className="border-t border-baby-pink-deep/50 pt-16 pb-8 font-body">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 lg:gap-12 mb-12">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <h2 className="font-heading text-3xl text-gold tracking-wide">Ghero</h2>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-gold/70 mt-1">
                by Kajal Soni
              </span>
            </Link>
            <p className="text-sm text-charcoal/70 mb-6 max-w-xs leading-relaxed">
              Premium Traditional Clothing. Elegance woven into every thread, bringing timeless Indian fashion to the modern woman.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com/ghero_0" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-white transition-colors" aria-label="Instagram">
                <ExternalLink className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-white transition-colors" aria-label="Facebook">
                <Heart className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="font-heading text-lg text-gold mb-5 border-b border-gold/30 pb-2 inline-block">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { label: 'Shop All', href: '/shop' },
                { label: 'New Arrivals', href: '/shop' },
                { label: 'Bestsellers', href: '/shop' },
                { label: 'About Us', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-charcoal/70 hover:text-gold transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div className="col-span-1">
            <h3 className="font-heading text-lg text-gold mb-5 border-b border-gold/30 pb-2 inline-block">Categories</h3>
            <ul className="space-y-3">
              {categories.map((item) => (
                <li key={item.id}>
                  <Link href={`/category/${item.slug}`} className="text-sm text-charcoal/70 hover:text-gold transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="col-span-1">
            <h3 className="font-heading text-lg text-gold mb-5 border-b border-gold/30 pb-2 inline-block">Customer Care</h3>
            <ul className="space-y-3 mb-6">
              {[
                { label: 'Track Order', href: '/account/orders' },
                { label: 'Shipping Policy', href: '/shipping-policy' },
                { label: 'Return Policy', href: '/refund-policy' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-charcoal/70 hover:text-gold transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="space-y-3">
              <a href="mailto:gherobykajalsoni@gmail.com" className="flex items-center gap-3 text-sm text-charcoal/70 hover:text-gold transition-colors">
                <Mail className="w-4 h-4 text-gold" />
                gherobykajalsoni@gmail.com
              </a>
              <a href="tel:+919166880664" className="flex items-center gap-3 text-sm text-charcoal/70 hover:text-gold transition-colors">
                <Phone className="w-4 h-4 text-gold" />
                +91 91668 80664
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gold/30 pt-6 flex flex-col md:flex-row items-center justify-center">
          <p className="text-xs text-charcoal/50 text-center">
            &copy; {new Date().getFullYear()} Ghero by Kajal Soni. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
