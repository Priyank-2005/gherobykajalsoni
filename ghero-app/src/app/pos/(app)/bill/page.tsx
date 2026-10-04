import { listPinStaff } from "@/lib/pos-auth";
import { getOpenRegister } from "@/lib/services/register.service";
import { getStoreSettings } from "@/lib/services/store-settings.service";
import { BillScreen } from "@/components/pos/bill-screen";

export const metadata = { title: "New bill" };

export default async function NewBillPage() {
  const [settings, register, staff] = await Promise.all([getStoreSettings(), getOpenRegister(), listPinStaff()]);
  return (
    <BillScreen
      upiId={settings.upiId}
      storeName={settings.storeName}
      registerOpen={Boolean(register)}
      approvers={staff.filter((s) => s.role !== "CASHIER")}
    />
  );
}
