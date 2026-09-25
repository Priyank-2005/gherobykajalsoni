import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { listAddresses } from "@/lib/services/address.service";
import { CheckoutFlow } from "./checkout-flow";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const session = await getSession();
  const addresses = session ? await listAddresses(session.user.id) : [];

  return (
    <CheckoutFlow
      savedAddresses={addresses.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        phone: a.phone,
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2 ?? "",
        area: a.area,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        isDefault: a.isDefault,
      }))}
    />
  );
}
