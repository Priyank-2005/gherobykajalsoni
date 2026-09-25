import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <nav className="flex items-center text-sm text-gray-500 mb-8 font-body">
        <Link href="/" className="hover:text-wine transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-charcoal">Contact Us</span>
      </nav>

      <h1 className="font-heading text-4xl md:text-5xl text-charcoal mb-12">
        Contact Us
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h2 className="font-heading text-2xl text-charcoal mb-6">Get in Touch</h2>
          <p className="font-body text-gray-600 mb-8">
            We&apos;d love to hear from you. Whether you have a question about our
            collections, need assistance with an order, or just want to say hello,
            our team is here to help.
          </p>

          <ContactForm />
        </div>

        <div className="bg-cream p-10 lg:p-12">
          <h2 className="font-heading text-2xl text-charcoal mb-8">Contact Information</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-wine flex-shrink-0" />
              <div>
                <h3 className="font-heading text-lg text-charcoal">Email</h3>
                <a href="mailto:gherobykajalsoni@gmail.com" className="font-body text-gray-600 mt-1 block break-all hover:text-wine transition-colors">gherobykajalsoni@gmail.com</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 text-wine flex-shrink-0" />
              <div>
                <h3 className="font-heading text-lg text-charcoal">Phone</h3>
                <a href="tel:+919166880664" className="font-body text-gray-600 mt-1 block hover:text-wine transition-colors">+91 91668 80664</a>
                <p className="font-body text-sm text-gray-500 mt-1">Mon-Sat, 10am - 6pm IST</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-wine flex-shrink-0" />
              <div>
                <h3 className="font-heading text-lg text-charcoal">Studio</h3>
                <p className="font-body text-gray-600 mt-1">
                  123 Fashion Street, <br />
                  Mumbai, Maharashtra 400001, <br />
                  India
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 pt-4">
              <ExternalLink className="w-6 h-6 text-wine flex-shrink-0" />
              <div>
                <h3 className="font-heading text-lg text-charcoal">Instagram</h3>
                <a href="#" className="font-body text-gray-600 mt-1 hover:text-wine transition-colors">
                  @ghero_0
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
