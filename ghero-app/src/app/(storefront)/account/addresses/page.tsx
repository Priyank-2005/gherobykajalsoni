import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listAddresses } from "@/lib/services/address.service";
import { AddressBook } from "./address-book";

export const metadata: Metadata = { title: "Saved Addresses" };

export default async function AddressesPage() {
  const { user } = await requireAuth();
  const addresses = await listAddresses(user.id);
  return (
    <AddressBook
      initial={addresses.map((a) => ({
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
