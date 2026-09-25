import { z } from "zod";
import { clientIp, handle, ok, parseBody, tooMany } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { addressSchema } from "@/lib/validations/address";
import { sendContactMessage } from "@/lib/services/email.service";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  phone: addressSchema.shape.phone.optional().or(z.literal("").transform(() => undefined)),
  message: z.string().trim().min(10, "Please write a few more words").max(5000),
  // Honeypot: real users never fill this hidden field.
  website: z.string().max(500).optional(),
});

/** Contact form: emails the store inbox (Reply-To = customer). */
export const POST = handle(async (request: Request) => {
  if (!rateLimit({ key: `contact:${clientIp(request)}`, limit: 5, windowSeconds: 3600 }).success) {
    throw tooMany("You've sent several messages already. Please try again later or email us directly.");
  }
  const { website, ...msg } = await parseBody(request, contactSchema);
  // Bots that fill the honeypot get a normal-looking success and nothing is sent.
  if (!website) await sendContactMessage(msg);
  return ok({ success: true });
});
