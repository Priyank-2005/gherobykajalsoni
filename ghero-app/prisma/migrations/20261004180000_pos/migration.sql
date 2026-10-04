-- In-store POS: staff & devices, barcodes, stock history, shop bills, payments, cash register.

-- Barcode numbers for price tags (8 digits, never reused). Must exist before the column default.
CREATE SEQUENCE "barcode_seq" START WITH 20000001 MINVALUE 20000001 MAXVALUE 99999999 NO CYCLE;

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('ONLINE', 'POS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD');

-- CreateEnum
CREATE TYPE "StockReason" AS ENUM ('INITIAL', 'ONLINE_SALE', 'POS_SALE', 'RECEIVED', 'ADJUSTMENT', 'CANCEL');



ALTER TYPE "Role" ADD VALUE 'MANAGER';
ALTER TYPE "Role" ADD VALUE 'CASHIER';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledById" TEXT,
ADD COLUMN     "cashierId" TEXT,
ADD COLUMN     "channel" "OrderChannel" NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "manualDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "registerSessionId" TEXT,
ADD COLUMN     "roundOff" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "lineDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "barcode" TEXT NOT NULL DEFAULT (nextval('barcode_seq'::regclass))::text;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StaffProfile" (
    "userId" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "maxDiscountPercent" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedPinAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PosDevice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "registeredById" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegisterSession" (
    "id" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "openingCash" DECIMAL(10,2) NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "expectedCash" DECIMAL(10,2),
    "countedCash" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "note" TEXT,

    CONSTRAINT "RegisterSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'store',
    "storeName" TEXT NOT NULL DEFAULT 'Ghero by Kajal Soni',
    "addressLine" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "pincode" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "gstin" TEXT,
    "billFooter" TEXT NOT NULL DEFAULT 'Prices are inclusive of all taxes. Thank you for shopping with us!',
    "upiId" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'GHS',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceCounter" (
    "series" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("series")
);

-- CreateTable
CREATE TABLE "VariantBarcode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VariantBarcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "variantId" TEXT,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "reason" "StockReason" NOT NULL,
    "orderId" TEXT,
    "userId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "tendered" DECIMAL(10,2),
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PosDevice_tokenHash_key" ON "PosDevice"("tokenHash");

-- CreateIndex
CREATE INDEX "PosDevice_registeredById_idx" ON "PosDevice"("registeredById");

-- CreateIndex
CREATE INDEX "PosSession_userId_idx" ON "PosSession"("userId");

-- CreateIndex
CREATE INDEX "PosSession_deviceId_idx" ON "PosSession"("deviceId");

-- CreateIndex
CREATE INDEX "PosSession_expiresAt_idx" ON "PosSession"("expiresAt");

-- CreateIndex
CREATE INDEX "RegisterSession_closedAt_idx" ON "RegisterSession"("closedAt");

-- CreateIndex
CREATE INDEX "RegisterSession_openedAt_idx" ON "RegisterSession"("openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VariantBarcode_code_key" ON "VariantBarcode"("code");

-- CreateIndex
CREATE INDEX "VariantBarcode_variantId_idx" ON "VariantBarcode"("variantId");

-- CreateIndex
CREATE INDEX "StockMovement_variantId_createdAt_idx" ON "StockMovement"("variantId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_reason_idx" ON "StockMovement"("reason");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_orderId_idx" ON "StockMovement"("orderId");

-- CreateIndex
CREATE INDEX "OrderPayment_orderId_idx" ON "OrderPayment"("orderId");

-- CreateIndex
CREATE INDEX "OrderPayment_method_idx" ON "OrderPayment"("method");

-- CreateIndex
CREATE INDEX "Order_channel_createdAt_idx" ON "Order"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "Order_registerSessionId_idx" ON "Order"("registerSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_barcode_key" ON "ProductVariant"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosDevice" ADD CONSTRAINT "PosDevice_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSession" ADD CONSTRAINT "PosSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSession" ADD CONSTRAINT "PosSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PosDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisterSession" ADD CONSTRAINT "RegisterSession_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegisterSession" ADD CONSTRAINT "RegisterSession_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantBarcode" ADD CONSTRAINT "VariantBarcode_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_registerSessionId_fkey" FOREIGN KEY ("registerSessionId") REFERENCES "RegisterSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Dummy store details for bills until the real ones are entered in Admin -> POS settings.
INSERT INTO "StoreSettings" ("id", "addressLine", "city", "state", "pincode", "phone", "email", "updatedAt")
VALUES ('store', 'Shop No. 1, Sample Market Road', 'Jaipur', 'Rajasthan', '302001', '+91 91668 80664', 'gherobykajalsoni@gmail.com', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
