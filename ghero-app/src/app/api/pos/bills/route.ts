import { after } from "next/server";
import { ok, parseBody } from "@/lib/api";
import { posRoute } from "@/lib/pos-api";
import { createBillSchema } from "@/lib/validations/pos";
import { createBill, getBill } from "@/lib/services/pos-bill.service";
import { sendPosBillEmail } from "@/lib/services/email.service";
import { formatStoreAddress, getStoreSettings } from "@/lib/services/store-settings.service";

/** Save a paid shop bill (stock drops for the website at the same moment). */
export const POST = posRoute("CASHIER", async (session, request: Request) => {
  const input = await parseBody(request, createBillSchema);
  const bill = await createBill(session, input);
  if (bill.emailTo) {
    const to = bill.emailTo;
    // Email the bill after responding, so the counter isn't kept waiting.
    after(async () => {
      const [view, s] = await Promise.all([getBill(bill.id), getStoreSettings()]);
      await sendPosBillEmail(to, view, { storeName: s.storeName, address: formatStoreAddress(s), phone: s.phone, billFooter: s.billFooter });
    });
  }
  return ok({ id: bill.id, billNumber: bill.billNumber, emailed: Boolean(bill.emailTo) }, { status: 201 });
});
