"use client";

import { useState } from "react";
import { addressSchema } from "@/lib/validations/address";
import { INDIAN_STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type AddressFields = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
};

export const emptyAddress: AddressFields = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
};

/** Validate with the same Zod schema the server uses; returns field → message. */
export function validateAddress(values: AddressFields) {
  const result = addressSchema.safeParse(values);
  if (result.success) return { data: result.data, errors: {} as Record<string, string> };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) errors[String(issue.path[0])] ??= issue.message;
  return { data: null, errors };
}

const inputCls = (err?: string) =>
  cn(
    "w-full border px-4 py-2.5 bg-white text-charcoal focus:outline-none focus:border-wine focus:ring-1 focus:ring-wine",
    err ? "border-red-400" : "border-gray-300"
  );

function Field({ id, label, error, required, className, children }: { id: string; label: string; error?: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm text-gray-700 mb-1">
        {label}
        {required && <span className="text-wine"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

/** Controlled address fields (no <form>): the parent owns submit. */
export function AddressForm({
  values,
  onChange,
  errors,
  idPrefix = "addr",
}: {
  values: AddressFields;
  onChange: (values: AddressFields) => void;
  errors: Record<string, string>;
  idPrefix?: string;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const set = (k: keyof AddressFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...values, [k]: e.target.value });
  const id = (k: string) => `${idPrefix}-${k}`;
  const err = (k: keyof AddressFields) => errors[k];
  const aria = (k: keyof AddressFields) => ({
    id: id(k),
    name: k,
    "aria-invalid": Boolean(err(k)) || undefined,
    "aria-describedby": err(k) ? `${id(k)}-error` : undefined,
    onBlur: () => setTouched({ ...touched, [k]: true }),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field id={id("fullName")} label="Full name" required error={err("fullName")}>
        <input {...aria("fullName")} autoComplete="name" value={values.fullName} onChange={set("fullName")} className={inputCls(err("fullName"))} />
      </Field>
      <Field id={id("phone")} label="Mobile number" required error={err("phone")}>
        <input {...aria("phone")} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile" value={values.phone} onChange={set("phone")} className={inputCls(err("phone"))} />
      </Field>
      <Field id={id("addressLine1")} label="Address (house no., street)" required error={err("addressLine1")} className="md:col-span-2">
        <input {...aria("addressLine1")} autoComplete="address-line1" value={values.addressLine1} onChange={set("addressLine1")} className={inputCls(err("addressLine1"))} />
      </Field>
      <Field id={id("addressLine2")} label="Apartment / building" error={err("addressLine2")} className="md:col-span-2">
        <input {...aria("addressLine2")} autoComplete="address-line2" value={values.addressLine2} onChange={set("addressLine2")} className={inputCls(err("addressLine2"))} />
      </Field>
      <Field id={id("area")} label="Area / locality" required error={err("area")}>
        <input {...aria("area")} autoComplete="address-level3" value={values.area} onChange={set("area")} className={inputCls(err("area"))} />
      </Field>
      <Field id={id("city")} label="City" required error={err("city")}>
        <input {...aria("city")} autoComplete="address-level2" value={values.city} onChange={set("city")} className={inputCls(err("city"))} />
      </Field>
      <Field id={id("state")} label="State" required error={err("state")}>
        <select {...aria("state")} autoComplete="address-level1" value={values.state} onChange={set("state")} className={inputCls(err("state"))}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field id={id("pincode")} label="Pincode" required error={err("pincode")}>
        <input {...aria("pincode")} inputMode="numeric" maxLength={6} autoComplete="postal-code" value={values.pincode} onChange={set("pincode")} className={inputCls(err("pincode"))} />
      </Field>
      <Field id={id("country")} label="Country" className="md:col-span-2">
        <input id={id("country")} value="India" disabled className="w-full border border-gray-300 px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed" />
      </Field>
    </div>
  );
}
