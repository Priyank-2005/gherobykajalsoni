-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isViral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viralVideoCloudinaryId" TEXT,
ADD COLUMN     "viralVideoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Product_isViral_idx" ON "Product"("isViral");
