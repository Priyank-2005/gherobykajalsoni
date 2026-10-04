import { ok, parseBody } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { storeSettingsSchema } from "@/lib/validations/pos";
import { getStoreSettings, updateStoreSettings } from "@/lib/services/store-settings.service";

export const GET = adminRoute(async () => ok({ settings: await getStoreSettings() }));

/** Store details printed on shop bills. */
export const PUT = adminRoute(async (request: Request) => {
  const input = await parseBody(request, storeSettingsSchema);
  return ok({ settings: await updateStoreSettings(input) });
});
