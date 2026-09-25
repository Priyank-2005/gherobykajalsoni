import { handle, ok } from "@/lib/api";
import { getCurrentCartView } from "@/lib/services/cart.service";

export const GET = handle(async () => ok(await getCurrentCartView()));
