# Ghero POS: Plan, Changes & Progress

> **Status: built and tested (all 4 stages), not yet committed or deployed.**
> Single file for the POS work: decisions, what was built, how to use it, and progress.
> Source: `docs/Offline_Store_POS_Proposal.pdf` (4 Oct 2026), checked against the code and database.

---

## Contents

1. [Decisions (confirmed)](#1-decisions-confirmed)
2. [Answers to the original questions](#2-answers-to-the-original-questions)
3. [What was built](#3-what-was-built)
4. [How to use it](#4-how-to-use-it)
5. [What you need to buy / have](#5-what-you-need-to-buy--have)
6. [Screens](#6-screens)
7. [Barcodes & labels](#7-barcodes--labels)
8. [Rules: one stock for shop + website](#8-rules-one-stock-for-shop--website)
9. [Proposal check: every item in the PDF](#9-proposal-check-every-item-in-the-pdf)
10. [Technical design](#10-technical-design)
11. [Testing done](#11-testing-done)
12. [Before going live](#12-before-going-live)
13. [Next release (not built)](#13-next-release-not-built)
14. [Progress tracker](#14-progress-tracker)
15. [Change log](#15-change-log)

---

## 1. Decisions (confirmed)

| # | Decision | Answer | How it's built |
|---|---|---|---|
| D1 | Billing device | **Phone or iPad** | Phone-first screens; iPad/laptop show the bill and totals side by side. Camera scanning built in. |
| D2 | Label paper | **Decide later; for now an A4 sheet with as many codes as possible** | A4, **65 labels per sheet** (5 × 13, 38.1 × 21.2 mm), the most that still scan with a phone camera. Plain paper (cut along light guide lines) or ready-made 65-up sticker sheets. |
| D3 | Barcode format | **Numeric** | 8 digits from `20000001`, never reused. Printed as Code 128. |
| D4 | Store details on bills | **Dummy for now** | Sample address in Admin → POS settings; the real phone/email from the existing invoice. Change any time. |
| D5 | Taxes | **Included in the product price** | No GST lines on bills. Bills say "Prices are inclusive of all taxes". GSTIN is printed if entered in settings. |
| D6 | Staff | **3–4 dummy profiles** | Owner PIN + Neha Sharma (Manager, 25%), Pooja Verma (Cashier, 10%), Aman Gupta (Cashier, 5%). Test PINs are in `ghero-app/prisma/seed-pos.ts`. |
| D7 | Customer phone on every bill | **Yes** | Pay is disabled until a valid 10-digit mobile is entered. |
| D8 | Returns / exchanges | **None** | Not built. A manager can **cancel** a bill made by mistake (same day only); stock goes back. |
| D9 | Shop-only / last-piece buffer | **Off** | Not built. |
| D10 | Optional modules | **Next release** | Not built (see §13). |
| D11 | Existing stock | **Products added in the admin panel; barcodes created from them** | Every new size/colour gets a barcode automatically from the database. |
| D12 | Receipt | **A4 print + automatic email** | Bill page prints on A4. If the customer has an email, the bill is emailed automatically. The owner gets a day-end summary email when the day is closed. |
| — | Where it runs | **`/pos` on the current site** | `https://<site>/pos`. A `pos.` subdomain later needs a custom domain (one routing change). |

---

## 2. Answers to the original questions

**Phone camera instead of a barcode scanner?** Yes. On the bill screen, tap **Scan**: the back camera opens in the page and keeps reading tags. Each tag adds the item (same tag again = +1). Android Chrome uses its built-in reader (fast). iPhone/iPad Safari uses a JavaScript reader (ZXing). The camera needs `https://` (Vercel provides it). A USB/Bluetooth scanner also works with no setup, because it "types" the code. Laptop webcams don't focus close enough, so use a phone or iPad.

**Printing barcodes on A4?** Yes. The Barcodes page downloads a PDF of labels laid out on A4 (65 per sheet). Print at **100% / Actual size**, then cut along the light lines (or use 65-up sticker sheets). Each label has the product name, size/colour, price (and struck-through MRP), the barcode and its number. All 7 labels on a test sheet decoded correctly at 300 dpi.

**Tracking products with barcodes?** Every size/colour has one permanent barcode. Pieces of the same size carry copies of the same label. Selling, receiving, adjusting and cancelling all change **one shared stock** (shop + website), and every change is listed in **Admin → Stock history** with who, when and why.

---

## 3. What was built

**POS (`/pos`), phone-first**
- Sign-in: a device is set up once by the owner (admin email + password) or a manager with a password. Staff then tap their name and enter a **PIN**. Auto-lock after **10 minutes** idle (enforced on the server too). 5 wrong PINs lock that PIN for 15 minutes (counted in the database).
- **New bill**: camera / scanner / search by name. Qty −/+, line discount (₹ or %), bill discount (₹ or %), coupon codes (same as the website), required customer phone with lookup (returning customer: shop + online purchases and total spent), optional name and email, hold / recall bills, and the bill in progress survives a refresh.
- **Discount limits**: above the cashier's limit, a manager or the owner approves with their PIN. Their own limit is checked as soon as they enter it.
- **Payment**: Cash (change to give back, quick note buttons), UPI (QR with the exact amount when a shop UPI ID is set in settings), Card, or split. Totals round to the nearest rupee.
- **Bill page**: A4 print, email (automatic + resend), cancel (manager, or cashier with a manager PIN; only while the day is open).
- **Today's bills** (managers can look at earlier days), **Stock check** (scan → all sizes, stock, on website or not), **Receive stock** (managers; then print labels for exactly those pieces), **Barcodes** (managers), **Open / close the day** (opening cash, expected vs counted cash; a difference needs a note).
- Installable on the home screen (web app manifest + icon).

**Admin panel (owner)**
- **Dashboard**: shop vs website sales today, cash in drawer, an alert for "paid online but out of stock (refund needed)". Order-status cards now count website orders only.
- **Orders**: filter Website / Shop. Shop bills show as the bill document. Invoice print works for both.
- **Products**: "Barcodes & labels" card per product (barcode per size, supplier barcodes, label downloads). Stock edits are recorded in stock history.
- **Stock history** (new): every change with filters, plus **Adjust stock** (damaged, gift, sample, lost, found, count correction).
- **Reports** (new): sales by day (shop vs website), payments, categories, best sellers, staff, discounts, cancellations, stock on hand and slow-moving items, CSV export (opens in Excel).
- **Staff & devices** (new): add/edit staff, PINs, discount limits, deactivate, the owner's own PIN, and remove lost devices.
- **POS settings** (new): shop details on bills, GSTIN, footer, UPI ID, bill-number prefix.

**Also changed**
- A customer can now exist with just a phone number. If a phone-only shop customer later adds that number to an online account, the two records merge so both histories show together.
- Admin dates and times are always shown in India time (Vercel runs in UTC).

---

## 4. How to use it

1. **Restart the dev server** (`npm run dev`): the database client changed.
2. Open `/pos` on the shop phone/iPad, sign in **once** with the owner's admin email and password, and name the device.
3. Staff tap their name and enter their PIN (test PINs: `ghero-app/prisma/seed-pos.ts`).
4. **Open the day** (opening cash), then **New bill**.
5. Labels: **Barcodes** → category → (subcategory) → product → **Download labels**. Choose "one per piece in stock" or "one per size", and "start at label #" for a part-used sheet. Use **Test print** once to check alignment.
6. End of day: **Close the day** and count the cash. The owner gets a summary email.

**Scripts** (run in `ghero-app/`, against `GHERO_DATABASE_URL`):

| Command | What it does |
|---|---|
| `npm run db:seed-pos` | Dummy staff + owner PIN (already run; safe to re-run) |
| `npm run db:seed-pos-demo` | Realistic demo data (already run) |
| `npm run db:seed-pos-demo -- --reset` | Recreate the demo data with fresh dates |
| `npm run db:seed-pos-demo -- --remove` | **Remove all demo data** (do this before going live) |

**Demo data now in the database** (all ids start with `demo_`): 24 shop customers, 14 days of bills (76 bills + 1 cancelled, about ₹5.03 lakh, cash/UPI/card/split, some discounts approved by the manager), 13 closed days with cash counts (one ₹200 short, one ₹50 over, each with a note), **today's day open with 3 bills**, matching stock history, and 3 **draft** jewellery products (not on the website). **Live stock numbers are unchanged**: the demo history starts by receiving the pieces it later sells.

---

## 5. What you need to buy / have

| Item | Have / buy | Notes |
|---|---|---|
| Phone (Android preferred) or iPad | Existing | Android scans faster (built-in reader). |
| Internet at the counter + a backup hotspot | Existing | Uses very little data. |
| Printer (laser preferred) | Existing | Print labels at 100% / Actual size. Matte paper; avoid glossy. |
| A4 paper / A4 65-up sticker sheets / thick card | Buy | 65-up stickers (38.1 × 21.2 mm) line up with the PDF. |
| Tagging gun + fine barbs, paper trimmer, hole punch | Buy | For hanging tags. |

Later, only if needed: USB 2D scanner (₹2,500–6,000), thermal label printer, receipt printer, custom domain for `pos.` (no software change needed for the scanner).

---

## 6. Screens

| Screen | Path | Who |
|---|---|---|
| Sign in (device setup / PIN) | `/pos/login` | All |
| Home | `/pos` | All (Barcodes + Receive stock tiles for managers/owner) |
| New bill + payment | `/pos/bill` | All |
| Bill (print / email / cancel) | `/pos/bills/[id]` | All (cancel: manager or manager PIN) |
| Today's bills | `/pos/bills` | All (other days: managers) |
| Stock check | `/pos/stock` | All |
| Receive stock | `/pos/receive` | Manager, owner |
| Barcodes → category → product | `/pos/barcodes`, `/pos/barcodes/category/[id]`, `/pos/barcodes/product/[id]` | Manager, owner |
| Open / close the day | `/pos/register` | All |
| Admin: Stock history, Reports, Staff & devices, POS settings | `/admin/stock`, `/admin/reports`, `/admin/staff`, `/admin/settings` | Owner |

Staff without access to a screen are sent to POS home with a note. The admin panel stays owner-only.

---

## 7. Barcodes & labels

- Numbers come from a database sequence (`barcode_seq`, 20000001 upwards). Existing variants got numbers 20000001–20000020 when the update was applied. Every new size/colour added in the admin gets the next number automatically.
- Supplier barcodes (EAN/UPC on bought-in items) can be linked per size on the admin product page; the POS recognises them too. The SKU also works when typed.
- Label PDF: A4, 65 per sheet, vector bars (sharp on any printer), module 0.33 mm with quiet zones. Options: one per piece / one per size / custom per size, start position, cut lines.
- The POS always bills the **current** price. If a price changes, reprint that product's labels.

---

## 8. Rules: one stock for shop + website

1. One stock number per size/colour, shared by the shop and the website.
2. A shop bill reduces stock the moment it's saved; an online order when its payment is captured.
3. No overselling: the same "only if enough stock" database update is used for both. A bill can't be saved if a piece is gone.
4. Cancelled shop bills and cancelled paid online orders put stock back.
5. Every change is written to stock history in the same transaction.
6. **Known gap (website):** stock is taken when the online payment is captured. If the shop sells the last piece while an online customer is paying, the order is flagged and appears on the dashboard as "refund needed".

---

## 9. Proposal check: every item in the PDF

Legend: ✅ built as proposed · ⚠️ built differently (reason given) · ❌ not built by decision · 🕓 next release

| PDF section | Item | Status |
|---|---|---|
| §1/§3 | Code 128 barcodes on tags | ✅ |
| §3 | QR on bills for returns | ❌ (no returns, D8) |
| §4 | One barcode per size/colour, auto, never reused | ✅ (numeric, D3) |
| §4 | Link supplier EAN/UPC | ✅ |
| §4 | Label sizes 50×25 / 38×25 / rat-tail (thermal) | 🕓 (when a label printer is bought; layout is config-driven) |
| §4 | A4 sticker sheets | ✅ 65-up (D2) |
| §5/§6 | Hardware | Phone/iPad + existing printer (Set A) |
| §7 | `/pos` path; subdomain later | ✅ / 🕓 (needs a custom domain) |
| §7 | Installable app | ✅ |
| §7 | Staff can't open the admin panel | ✅ |
| §8 | Sign-in with PIN, auto-lock | ✅ |
| §8 | Open / close register, Z report | ✅ (summary on screen + email) |
| §8 | Billing: scan, search, qty, line + bill discount, coupon, hold/recall | ✅ |
| §8 | Payment: cash + change, UPI QR, card, split | ✅ (store credit ❌, no returns) |
| §8 | Bill: A4 / email / PDF | ✅ A4 print (Save as PDF from print), email. 80 mm receipt 🕓 |
| §8 | Today's bills, manager cancel | ✅ |
| §8 | Returns & exchange | ❌ (D8) |
| §8 | Customers: phone lookup, online + offline history | ✅ (in the bill screen and Admin → Customers) |
| §8 | Stock lookup | ✅ |
| §8 | Admin: barcodes & labels, receive stock, adjustments, ledger, orders filter, reports, staff, settings | ✅ (receive stock is in the POS so the phone can do it) |
| §8/§9.2 | Stock count (stock-take) | 🕓 |
| §9.2 | Gift vouchers, loyalty, WhatsApp, purchase orders | 🕓 |
| §9.2 | Daily summary email | ✅ (sent when the day is closed) |
| §9.3 | Rental jewellery, stitching orders, alterations, offline billing | 🕓 (D10) |
| §10 | One shared stock, no overselling, restock on cancel, history | ✅ |
| §10 | Online buffer / shop-only items | ❌ (D9) |
| §11 | Razorpay payment links for phone orders | 🕓 |
| §12 | GST breakup, HSN, rate slabs, GST export | ❌ for now (D5: prices include tax). GSTIN printable. |
| §13 | Roles, manager PIN, audit, deactivate | ✅ |
| §14 | Internet outage | Hotspot backup; clear error if the bill can't be saved. Offline mode 🕓 |
| §15 | Server load / cost | As estimated. See §11 for speed. |
| §16 | Website & admin changes | ✅ (§3) |
| App. A | Data model | ✅ mostly. Differences: shop bills reuse `Order` (channel `POS`), keeping the customer in the shipping snapshot and the shop as the address, so all existing order screens work and the live site's current code reads them safely. Customers need a phone, so `Order.userId` stays required. No `TaxRule` (D5). Added `PosDevice`, `PosSession`, `StoreSettings`, `InvoiceCounter`. |

---

## 10. Technical design

**Database** (migration `20261004180000_pos`, already applied to the database in `GHERO_DATABASE_URL`):
- `Role` + `MANAGER`, `CASHIER`. New enums `OrderChannel`, `PaymentMethod`, `StockReason`.
- `User.email` optional, `User.phone` unique (normalised 10 digits).
- `ProductVariant.barcode` (unique, default from `barcode_seq`), `VariantBarcode` (supplier codes).
- `StockMovement` (stock history), `StaffProfile` (PIN, limit, lockout), `PosDevice`, `PosSession`, `RegisterSession`, `StoreSettings` (seeded with dummy details), `InvoiceCounter`.
- `Order`: `channel`, `manualDiscount`, `roundOff`, `cashierId`, `approvedById`, `registerSessionId`, `cancelledById`, `cancelledAt`. `OrderItem.lineDiscount`. `OrderPayment` (split payments).
- All changes are additive or loosen constraints, so the site currently deployed keeps working against this database.

**Code** (all in `ghero-app/src`)
- Pages: `app/pos/login`, `app/pos/(app)/…`; admin `app/admin/(panel)/{stock,reports,staff,settings}`.
- APIs: `app/api/pos/…` (auth, catalog, customers, bills, register, stock, labels, manifest, icon), `app/api/admin/{staff,pos-devices,settings,stock,reports}` + supplier barcodes.
- Services: `pos-bill`, `register`, `stock`, `labels`, `reports`, `staff`, `store-settings`, `pos-customer`, `pos-auth` + `lib/pos-auth.ts`, `lib/barcode.ts` (Code 128 encoder), `lib/ist.ts`.
- `inventory.service.applyStockDeltas` is the single place stock changes: one SQL statement updates stock (never below 0) and writes the history rows.
- Bills: priced on the server, one transaction (customer, gap-free bill number, order, items, payments, stock), idempotency key per bill so retries can't double-bill.
- `proxy.ts`: `/pos` pages without a POS session go to `/pos/login`. POS uses its own cookies, separate from the website/admin session.
- The device keeps a copy of the product/barcode list, so scans are instant; the server re-checks everything when saving.
- New packages: `pdf-lib`, `qrcode`, `@zxing/browser`, `@zxing/library` (+ `@types/qrcode`).

---

## 11. Testing done

Typecheck, lint and production build are clean. Tested end to end on a local production build at `/pos` (phone size) against the real database, then cleaned up:

- Device setup; PIN sign-in (wrong PIN counted, correct PIN works); lock; cashier blocked from manager screens (redirect with a note) and APIs (403).
- Open day → bill: barcode typed (as a scanner does), same tag twice = qty 2, name search. Required phone, 30% discount by a 10% cashier → approval asked. A 25% manager is refused, the owner approves. Split payment (cash + UPI) must match the total. Bill saved as GHS/26-27/00001 with correct maths (₹4,998 − 30% = ₹3,498.60 → ₹3,499). Retry with the same key returns the same bill. Overselling and payment mismatches are refused.
- Cancel by cashier with manager PIN: stock back (28 → 30), bill marked cancelled, cancel and email buttons hidden.
- Receive stock (+2), stock check by barcode and by SKU, unknown code → clear message.
- Labels: test sheet, category, one-per-size with start position, custom quantities; empty selection → clear error. A rendered 300 dpi page: **all barcodes decoded** with ZXing; the layout was checked visually.
- Close day: a cash difference needs a note; billing is blocked after close. The summary email was attempted (blocked on the test server on purpose).
- Admin: dashboard, orders (Website/Shop filter), shop bill view, invoice, staff, settings, stock history, reports, CSV export.
- Bugs found and fixed while testing: the bill screen scrolled sideways on phones; manager-only pages returned an error instead of redirecting; an approval from a manager with too low a limit wasn't caught until saving; admin times would show in UTC on Vercel; the owner card on Staff took the wrong admin.
- Code 128 encoder: every digit pair and printable character decoded correctly.

**Speed:** from this computer each bill took about 6 s because the database is in the US and every step is a round trip. On Vercel the server runs in the same US region as the database, so it should be well under a second. Moving the database to Mumbai would speed up local development and the website.

---

## 12. Before going live

1. `npm run db:seed-pos-demo -- --remove` (removes demo bills, customers, days, drafts and history; bill numbers restart at 00001).
2. Admin → **POS settings**: real address, phone, email, GSTIN (if any), footer, UPI ID (double-check it), bill prefix.
3. Admin → **Staff & devices**: deactivate or edit the dummy staff, add real staff with their own PINs, change the owner PIN from the test value.
4. Add the real products (Admin → Products), count stock, print and attach labels.
5. Deploy (commit + push to `main`) and set up the counter device at `https://<site>/pos`.
6. Recommended: move the Neon database to Mumbai (ap-south-1).

---

## 13. Next release (not built)

Stock count with scanner · gift vouchers / store credit · loyalty points · WhatsApp bills and broadcasts · purchase orders & suppliers · Razorpay payment links · rental jewellery · stitching orders · alterations · offline billing · thermal label and receipt printers · "price changed since last print" filter · `pos.` subdomain · GST breakup and GST reports (if the CA asks).

---

## 14. Progress tracker

`[x]` done · `[ ]` not done

**Planning**
- [x] Proposal read and checked against the code
- [x] Plan written and decisions confirmed (§1)

**Stage 1: Foundations**
- [x] Schema + migration applied; barcodes back-filled (20000001–20000020)
- [x] Stock history for online sale / cancel / admin edit / POS
- [x] POS sign-in (device + PIN), home, auto-lock
- [x] Barcodes page + label PDFs + test print
- [x] Admin: Staff & devices, POS settings, product barcodes, stock history

**Stage 2: Billing**
- [x] Phone-number customers, order channel, payments, bill numbers
- [x] Camera + scanner + search, device catalogue cache
- [x] Bill, payment (cash/UPI/card/split), A4 bill + email
- [x] Hold/recall, coupons, discount limits + manager PIN
- [x] Stock check, receive stock
- [x] Admin orders filter + shop bill view; installable app

**Stage 3: Cash** (returns removed by D8)
- [x] Open/close day + summary email
- [x] Today's bills, cancel with manager PIN, customer lookup

**Stage 4: Reports & go-live**
- [x] Reports + CSV export
- [x] Dashboard cards + refund-needed alert, stock adjustments
- [x] Dummy staff + demo data scripts
- [ ] Owner review in the shop (phone + printer)
- [ ] Go-live checklist (§12), commit and deploy

---

## 15. Change log

| Date | Change |
|---|---|
| 2026-10-04 | Plan created from the proposal and a review of the code/database. |
| 2026-10-04 | Decisions D1–D12 confirmed (§1). |
| 2026-10-04 | All 4 stages built: migration `20261004180000_pos` applied, POS at `/pos`, admin pages, label PDFs, reports. |
| 2026-10-04 | Tested end to end on a local production build; fixes listed in §11. Test data removed. |
| 2026-10-04 | Dummy staff (`db:seed-pos`) and realistic demo data (`db:seed-pos-demo`) added to the database. |
