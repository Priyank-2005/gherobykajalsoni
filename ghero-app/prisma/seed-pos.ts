/**
 * Dummy POS staff for trying the shop counter (`npm run db:seed-pos`). Safe to re-run:
 * existing people keep their PIN / settings; only missing ones are created.
 *
 * Test PINs (change or deactivate these in Admin -> Staff & devices before going live):
 *   Owner (ADMIN_EMAIL account)   PIN 1111
 *   Neha Sharma   Manager  25%    PIN 2222
 *   Pooja Verma   Cashier  10%    PIN 3333
 *   Aman Gupta    Cashier   5%    PIN 4444
 *
 * A PIN only works on a device that the owner (or a manager with a password) has set up at
 * /pos with email + password. The dummy manager gets a password only if SEED_MANAGER_PASSWORD
 * is set, so by default only the owner can set up devices.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STAFF = [
  { name: "Neha Sharma", email: "neha.manager@example.com", role: "MANAGER", pin: "2222", maxDiscountPercent: 25 },
  { name: "Pooja Verma", email: "pooja.cashier@example.com", role: "CASHIER", pin: "3333", maxDiscountPercent: 10 },
  { name: "Aman Gupta", email: "aman.cashier@example.com", role: "CASHIER", pin: "4444", maxDiscountPercent: 5 },
] as const;
const OWNER_PIN = "1111";

async function main() {
  const ownerEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const owner = ownerEmail ? await prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true, role: true } }) : null;
  if (owner?.role === "ADMIN") {
    const existing = await prisma.staffProfile.findUnique({ where: { userId: owner.id } });
    if (!existing) await prisma.staffProfile.create({ data: { userId: owner.id, pinHash: await bcrypt.hash(OWNER_PIN, 10), maxDiscountPercent: 100 } });
    console.log(existing ? "Owner already has a POS PIN; left unchanged." : "Owner POS PIN set.");
  } else {
    console.warn("Owner (ADMIN_EMAIL) not found; run `npm run db:seed` first. Skipping the owner PIN.");
  }

  const managerPassword = process.env.SEED_MANAGER_PASSWORD;
  for (const s of STAFF) {
    const found = await prisma.user.findUnique({ where: { email: s.email }, select: { id: true, staffProfile: { select: { userId: true } } } });
    if (found?.staffProfile) {
      console.log(`${s.name}: already exists; left unchanged.`);
      continue;
    }
    const passwordHash = s.role === "MANAGER" && managerPassword && managerPassword.length >= 10 ? await bcrypt.hash(managerPassword, 12) : null;
    const pinHash = await bcrypt.hash(s.pin, 10);
    if (found) {
      await prisma.user.update({ where: { id: found.id }, data: { name: s.name, role: s.role, ...(passwordHash ? { passwordHash } : {}), staffProfile: { create: { pinHash, maxDiscountPercent: s.maxDiscountPercent } } } });
    } else {
      await prisma.user.create({ data: { email: s.email, name: s.name, role: s.role, passwordHash, staffProfile: { create: { pinHash, maxDiscountPercent: s.maxDiscountPercent } } } });
    }
    console.log(`${s.name} (${s.role.toLowerCase()}) created.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
