/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,barcode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Product_barcode_key";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cargoProvider" TEXT,
ADD COLUMN     "returnRequestedAt" TIMESTAMP(3),
ADD COLUMN     "returnStatus" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "commissionAmount" DECIMAL(10,2),
ADD COLUMN     "commissionRate" DECIMAL(10,2),
ADD COLUMN     "netProfit" DECIMAL(10,2),
ADD COLUMN     "shippingCost" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costPrice" DECIMAL(10,2),
ADD COLUMN     "vatRate" INTEGER NOT NULL DEFAULT 20;

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_barcode_key" ON "Product"("tenantId", "barcode");
