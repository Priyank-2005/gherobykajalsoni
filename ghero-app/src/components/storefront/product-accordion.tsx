"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductAccordionProps {
  items: { title: string; content: React.ReactNode }[];
}

export function ProductAccordion({ items }: ProductAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="border-t border-gray-200">
      {items.map((item, index) => (
        <div key={index} className="border-b border-gray-200">
          <button
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between py-5 text-left focus:outline-none group"
          >
            <span className="text-base font-medium text-charcoal group-hover:text-wine transition-colors">
              {item.title}
            </span>
            {openIndex === index ? (
              <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-wine" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-wine" />
            )}
          </button>
          
          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pb-5 text-gray-600 prose prose-sm max-w-none text-sm leading-relaxed">
                  {item.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
