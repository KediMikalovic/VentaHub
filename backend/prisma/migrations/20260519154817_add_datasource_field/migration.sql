-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'TRENDYOL');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "source" "DataSource" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "source" "DataSource" NOT NULL DEFAULT 'MANUAL';
