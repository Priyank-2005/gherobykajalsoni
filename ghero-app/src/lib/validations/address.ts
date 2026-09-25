import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

/**
 * Address validation schemas.
 * addressLine1 = house/flat + street, addressLine2 = apartment/building (optional).
 */
const addressBase = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")),
  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  addressLine2: optionalText(200),
  area: z.string().trim().min(1, "Area / locality is required").max(100),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode"),
  country: z.literal("India"),
  isDefault: z.boolean(),
});

export const addressSchema = addressBase.extend({
  country: z.literal("India").default("India"),
  isDefault: z.boolean().default(false),
});

// Partial of the default-free base: Zod 4 applies defaults inside .partial(), which
// would otherwise reset isDefault on every edit.
export const updateAddressSchema = addressBase.partial();

export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
