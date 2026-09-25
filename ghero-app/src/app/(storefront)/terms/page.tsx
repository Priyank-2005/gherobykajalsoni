import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <nav className="flex items-center text-sm text-gray-500 mb-8 font-body">
        <Link href="/" className="hover:text-wine transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-charcoal">Terms of Service</span>
      </nav>

      <h1 className="font-heading text-4xl text-charcoal mb-8">Terms of Service</h1>

      <div className="prose prose-lg prose-p:font-body prose-headings:font-heading prose-a:text-wine max-w-none text-gray-700">
        <p className="text-sm text-gray-500 mb-8">Last updated: September 25, 2026</p>

        <h2>1. Overview</h2>
        <p>
          This website is operated by Ghero by Kajal Soni. Throughout the site, the terms &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refer to Ghero. Ghero offers this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
        </p>

        <h2>2. Online Store Terms</h2>
        <p>
          By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence. You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction.
        </p>

        <h2>3. Products or Services</h2>
        <p>
          Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy. We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. We cannot guarantee that your computer monitor&apos;s display of any color will be accurate.
        </p>

        <h2>4. Modifications to the Service and Prices</h2>
        <p>
          Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension, or discontinuance of the Service.
        </p>
      </div>
    </div>
  );
}
