import { after } from "next/server";
import { ok, parseBody } from "@/lib/api";
import { posRoute } from "@/lib/pos-api";
import { closeRegisterSchema } from "@/lib/validations/pos";
import { closeRegister } from "@/lib/services/register.service";
import { sendDayCloseEmail } from "@/lib/services/email.service";
import { getStoreSettings } from "@/lib/services/store-settings.service";

/** Close the day: record counted cash vs expected, and email the summary to the owner. */
export const POST = posRoute("CASHIER", async (session, request: Request) => {
  const { countedCash, note } = await parseBody(request, closeRegisterSchema);
  const summary = await closeRegister(session.staff.id, countedCash, note);
  after(async () => {
    const settings = await getStoreSettings();
    const to = settings.email || process.env.STORE_CONTACT_EMAIL || process.env.ADMIN_EMAIL;
    if (to) await sendDayCloseEmail(to, { ...summary, closedBy: session.staff.name });
  });
  return ok({ summary });
});
