"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DUMMY_PRODUCTS, DUMMY_CATEGORIES } from "@/lib/dummy-data";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { SizeSelector } from "@/components/storefront/size-selector";
import { ColorSelector } from "@/components/storefront/color-selector";
import { QuantitySelector } from "@/components/storefront/quantity-selector";
import { ProductAccordion } from "@/components/storefront/product-accordion";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const product = DUMMY_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const category = DUMMY_CATEGORIES.find((c) => c.slug === product.category.slug);
  
  const [selectedSize, setSelectedSize] = useState<string>(product.variants?.[0]?.size || "");
  const [selectedColor, setSelectedColor] = useState<string>(product.variants?.[0]?.color || "");
  const [quantity, setQuantity] = useState(1);

  const discount = calculateDiscount(product.baseMrp, product.basePrice);
  
  const accordionItems = [
    {
      title: "Description",
      content: <p>{product.description || "Elegant traditional wear crafted with precision and care."}</p>
    },
    {
      title: "Fabric & Care",
      content: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Premium blended silk/cotton fabric</li>
          <li>Dry clean only</li>
          <li>Do not bleach</li>
          <li>Iron on low heat</li>
        </ul>
      )
    },
    {
      title: "Size Guide",
      content: <p>Please refer to our standard sizing chart. Model is wearing size M and is 5'7" tall.</p>
    },
    {
      title: "Shipping & Returns",
      content: (
        <ul className="list-disc pl-5 space-y-1">
          <li>Free shipping on orders above ₹5000</li>
          <li>Delivery within 5-7 business days</li>
          <li>7-day return/exchange policy</li>
        </ul>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8 hidden md:block">
        <Link href="/" className="hover:text-wine">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-wine">Shop</Link>
        <span className="mx-2">/</span>
        {category && (
          <>
            <Link href={`/category/${category.slug}`} className="hover:text-wine">{category.name}</Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-charcoal font-medium truncate inline-block max-w-[200px] align-bottom">
          {product.name}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left Column - Images */}
        <div className="w-full lg:w-1/2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-[3/4] w-full bg-baby-pink rounded-sm overflow-hidden group"
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              priority
            />
          </motion.div>
          {/* Thumbnail strip could go here if we had multiple images */}
        </div>

        {/* Right Column - Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5, delay: 0.2 }}
          >
            {category && (
              <Link href={`/category/${category.slug}`} className="text-sm text-wine tracking-widest uppercase font-medium mb-2 inline-block hover:underline">
                {category.name}
              </Link>
            )}
            
            <h1 className="text-3xl md:text-4xl font-heading text-charcoal mb-2 leading-tight">
              {product.name}
            </h1>
            
            <p className="text-sm text-gray-400 mb-6 font-mono">
              SKU: {product.slug.toUpperCase()}-{product.id}
            </p>

            <div className="flex items-end gap-4 mb-8">
              <span className="text-2xl font-medium text-charcoal">
                {formatPrice(product.basePrice)}
              </span>
              {product.baseMrp > product.basePrice && (
                <>
                  <span className="text-lg text-gray-400 line-through mb-0.5">
                    {formatPrice(product.baseMrp)}
                  </span>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded mb-1">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="w-full h-px bg-gray-200 mb-8" />

            {/* Colors */}
            {product.variants && product.variants.some(v => v.color) && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-charcoal">Color: {selectedColor}</span>
                </div>
                <ColorSelector 
                  colors={Array.from(new Map(product.variants.filter(v => v.color).map(v => [v.color, v.colorHex])).entries()).map(([name, hex]) => ({ name, hex: hex as string }))} 
                  selectedColor={selectedColor} 
                  onSelect={setSelectedColor} 
                />
              </div>
            )}

            {/* Sizes */}
            {product.variants && product.variants.some(v => v.size) && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-charcoal">Size: {selectedSize}</span>
                  <button className="text-sm text-gray-500 underline hover:text-wine">Size Guide</button>
                </div>
                <SizeSelector 
                  sizes={Array.from(new Set(product.variants.map(v => v.size).filter(Boolean)))} 
                  selectedSize={selectedSize} 
                  onSelect={setSelectedSize} 
                />
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <span className="text-sm font-medium text-charcoal block mb-3">Quantity</span>
              <QuantitySelector quantity={quantity} onChange={setQuantity} max={product.variants.reduce((acc, v) => acc + (v.stock || 0), 0) || 10} />
            </div>

            {/* Stock Status */}
            <div className="mb-8 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.variants.reduce((acc, v) => acc + (v.stock || 0), 0) > 5 ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className={`text-sm ${product.variants.reduce((acc, v) => acc + (v.stock || 0), 0) > 5 ? 'text-green-600' : 'text-amber-600'}`}>
                {product.variants.reduce((acc, v) => acc + (v.stock || 0), 0) > 5 ? 'In Stock' : `Only ${product.variants.reduce((acc, v) => acc + (v.stock || 0), 0)} left in stock`}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button className="flex-1 h-14 bg-white border-2 border-charcoal text-charcoal font-medium text-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                Add to Cart
              </button>
              <button className="flex-1 h-14 bg-wine text-white font-medium text-lg hover:bg-wine/90 transition-colors shadow-lg shadow-wine/20">
                Buy Now
              </button>
            </div>

            {/* Accordion */}
            <div className="mt-auto">
              <ProductAccordion items={accordionItems} />
            </div>

            {/* Guarantees */}
            <div className="mt-8 grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-cream/50 rounded-sm">
                <Check className="w-5 h-5 mx-auto mb-2 text-wine" />
                <span className="text-xs font-medium text-charcoal block">100% Authentic</span>
              </div>
              <div className="p-4 bg-cream/50 rounded-sm">
                <Check className="w-5 h-5 mx-auto mb-2 text-wine" />
                <span className="text-xs font-medium text-charcoal block">Secure Checkout</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
