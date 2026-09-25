import { ok } from "@/lib/api";
import { adminRoute } from "@/lib/admin-api";
import { adminDashboard } from "@/lib/services/order.service";

export const GET = adminRoute(async () => ok(await adminDashboard()));
