import { redirect } from "next/navigation";

/** Code entry now happens inline on /login; keep this path working for old links. */
export default function VerifyPage() {
  redirect("/login");
}
