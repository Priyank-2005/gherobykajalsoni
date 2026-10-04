import { requireAdmin } from "@/lib/auth";
import { adminListStaff } from "@/lib/services/staff.service";
import { PageHeader } from "@/components/admin/ui";
import { StaffManager } from "./staff-manager";

export const metadata = { title: "Staff & devices" };

export default async function StaffPage() {
  const [session, data] = await Promise.all([requireAdmin(), adminListStaff()]);
  return (
    <>
      <PageHeader
        title="Staff & devices"
        description="Who can use the shop POS, their PINs and discount limits, and the phones / iPads set up as counters."
      />
      <StaffManager meId={session.user.id} staff={data.staff} devices={data.devices} />
    </>
  );
}
