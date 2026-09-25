"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-wine text-white rounded-md px-4 py-2 text-sm hover:bg-wine/90">
      <Printer className="w-4 h-4" /> Print / Save as PDF
    </button>
  );
}
