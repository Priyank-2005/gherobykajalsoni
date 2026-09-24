import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-8 font-body">
        <Link href="/" className="hover:text-wine transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-charcoal">About Us</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
        <div className="relative aspect-[3/4] w-full bg-gray-100">
          <Image
            src="https://images.unsplash.com/photo-1583391733958-692138e072b7?auto=format&fit=crop&q=80"
            alt="Ghero Craftsmanship"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-charcoal mb-6">
            Our Story
          </h1>
          <div className="prose prose-lg prose-p:font-body prose-p:text-gray-600">
            <p>
              Founded by Kajal Soni, Ghero is a celebration of timeless Indian
              craftsmanship and modern elegance. Our name, derived from the
              traditional &apos;ghera&apos; or twirl of a lehenga, embodies the joy and
              grace of feminine movement.
            </p>
            <p>
              Each piece in our collection is a labor of love, meticulously
              crafted by skilled artisans who have honed their techniques over
              generations. We believe in preserving heritage while creating
              heirlooms for the contemporary woman.
            </p>
            <p>
              From the initial sketch to the final stitch, our focus remains on
              quality, detail, and a flawless fit. We use only the finest
              fabrics, ensuring that when you wear Ghero, you feel as beautiful
              as you look.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-cream p-12 text-center max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl text-charcoal mb-6">Our Philosophy</h2>
        <p className="font-body text-gray-600 leading-relaxed text-lg mb-8">
          &quot;Fashion is more than what you wear; it is an expression of your identity and heritage. At Ghero, we strive to create garments that empower women to embrace their roots with pride and sophistication.&quot;
        </p>
        <p className="font-heading text-xl text-wine italic">— Kajal Soni</p>
      </div>
    </div>
  );
}
