import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <nav className="flex items-center text-sm text-gray-500 mb-8 font-body">
        <Link href="/" className="hover:text-wine transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-charcoal">Shipping Policy</span>
      </nav>

      <h1 className="font-heading text-4xl text-charcoal mb-8">Shipping Policy</h1>

      <div className="prose prose-lg prose-p:font-body prose-headings:font-heading prose-a:text-wine max-w-none text-gray-700">
        <p className="text-sm text-gray-500 mb-8">Last updated: September 25, 2026</p>

        <h2>Processing Time</h2>
        <p>
          All orders for ready-to-wear items are processed within 2-3 business days. Custom orders or made-to-measure items take between 15-20 business days to process and stitch before they are dispatched.
        </p>
        <p>
          Orders are not shipped or delivered on weekends or public holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.
        </p>

        <h2>Shipping Rates & Delivery Estimates</h2>
        <p>
          Shipping charges for your order will be calculated and displayed at checkout.
        </p>
        <ul>
          <li><strong>Standard Domestic Shipping (India):</strong> Free for orders above ₹5,000. For orders below, a flat rate of ₹150 applies. Delivery usually takes 4-7 business days.</li>
          <li><strong>Express Domestic Shipping:</strong> Available at an additional cost of ₹350. Delivery within 2-4 business days.</li>
          <li><strong>International Shipping:</strong> We currently ship to select countries. Shipping costs and delivery times vary depending on the destination and will be calculated at checkout.</li>
        </ul>

        <h2>Shipment Confirmation & Order Tracking</h2>
        <p>
          You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
        </p>

        <h2>Customs, Duties and Taxes</h2>
        <p>
          Ghero is not responsible for any customs and taxes applied to your international order. All fees imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.).
        </p>
      </div>
    </div>
  );
}
