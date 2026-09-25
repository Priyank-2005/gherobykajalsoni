import { handle, ok } from "@/lib/api";
import { getHomepage } from "@/lib/services/homepage.service";

export const GET = handle(async () => ok(await getHomepage()));
