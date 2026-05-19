-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('TRIAL', 'BASIC', 'PRO');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TRENDYOL', 'HEPSIBURADA');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('STANDARD', 'MICRO_EXPORT', 'FOREIGN_BROKERAGE');

-- CreateEnum
CREATE TYPE "LabelStatus" AS ENUM ('NONE', 'LABEL_PENDING', 'LABEL_READY');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT,
    "subscriptionPlan" "PlanType" NOT NULL DEFAULT 'TRIAL',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "taxInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantIntegration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'TRENDYOL',
    "sellerId" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "encryptedApiSecret" TEXT NOT NULL,
    "webhookId" TEXT,
    "webhookApiKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "salePrice" DECIMAL(10,2) NOT NULL,
    "listPrice" DECIMAL(10,2),
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'TRENDYOL',
    "orderNumber" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL DEFAULT 'STANDARD',
    "countryCode" TEXT NOT NULL DEFAULT 'TR',
    "status" TEXT NOT NULL,
    "cargoTrackingNumber" TEXT,
    "shippingLabels" JSONB,
    "labelStatus" "LabelStatus" NOT NULL DEFAULT 'NONE',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "claimLineItemId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "claimItemStatus" TEXT NOT NULL,
    "customerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialLedger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "orderId" TEXT,
    "expectedPaymentDate" TIMESTAMP(3),
    "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "sellerRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "commissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "cargoExpense" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "returnCargoExpense" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "netProfit" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnItem_claimLineItemId_key" ON "ReturnItem"("claimLineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialLedger_transactionId_key" ON "FinancialLedger"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialLedger_orderId_key" ON "FinancialLedger"("orderId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantIntegration" ADD CONSTRAINT "TenantIntegration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialLedger" ADD CONSTRAINT "FinancialLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialLedger" ADD CONSTRAINT "FinancialLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
