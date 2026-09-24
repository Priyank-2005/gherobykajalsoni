import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <nav className="flex items-center text-sm text-gray-500 mb-8 font-body">
        <Link href="/" className="hover:text-wine transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-charcoal">Refund & Return Policy</span>
      </nav>

      <h1 className="font-heading text-4xl text-charcoal mb-8">Refund & Return Policy</h1>

      <div className="prose prose-lg prose-p:font-body prose-headings:font-heading prose-a:text-wine max-w-none text-gray-700">
        <h2>Returns</h2>
        <p>
          Our return policy lasts 7 days from the date of delivery. If 7 days have gone by since your purchase was delivered, unfortunately, we can&apos;t offer you a refund or exchange.
        </p>
        <p>
          To be eligible for a return, your item must be unused, unwashed, and in the same condition that you received it. It must also be in the original packaging with all tags attached.
        </p>
        <p>
          Custom-made or made-to-measure items are exempt from being returned unless there is a manufacturing defect.
        </p>

        <h2>Refunds</h2>
        <p>
          Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
        </p>
        <p>
          If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days (typically 5-7 business days).
        </p>

        <h2>Exchanges</h2>
        <p>
          We only replace items if they are defective, damaged, or if you received the wrong size. If you need to exchange it for the same item in a different size, send us an email at <a href="mailto:support@gherobykajalsoni.com">support@gherobykajalsoni.com</a>.
        </p>

        <h2>Shipping Returns</h2>
        <p>
          To return your product, you should mail your product to our studio address provided in the Contact Us page. You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable.
        </p>
      </div>
    </div>
  );
}
