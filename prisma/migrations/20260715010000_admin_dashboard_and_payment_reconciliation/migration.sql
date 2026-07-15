CREATE TYPE "ProductAudience" AS ENUM ('MEN', 'WOMEN', 'UNISEX');

ALTER TABLE "Product"
ADD COLUMN "audience" "ProductAudience",
ADD COLUMN "costPricePesewas" INTEGER;

ALTER TABLE "Payment"
ADD COLUMN "providerStatus" TEXT,
ADD COLUMN "gatewayResponse" TEXT,
ADD COLUMN "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN "verificationAttempts" INTEGER NOT NULL DEFAULT 0;

DROP TABLE IF EXISTS "PaymentWebhookEvent";
DROP TYPE IF EXISTS "WebhookStatus";

CREATE INDEX "Product_audience_idx" ON "Product"("audience");
CREATE INDEX "Payment_status_lastCheckedAt_idx" ON "Payment"("status", "lastCheckedAt");

ALTER TABLE "Product"
ADD CONSTRAINT "Product_costPricePesewas_nonnegative"
CHECK ("costPricePesewas" IS NULL OR "costPricePesewas" >= 0);
