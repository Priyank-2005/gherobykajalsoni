import React, { forwardRef, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

/** Native select (best mobile UX + accessibility), styled to match <Input>. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-charcoal mb-1.5 font-body">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error) || undefined}
            className={cn(
              "appearance-none flex h-10 w-full rounded-md border border-charcoal/20 bg-white pl-3 pr-9 text-sm text-charcoal font-body focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wine focus-visible:border-wine disabled:opacity-50",
              error && "border-red-500",
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/50" />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500 font-body">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
