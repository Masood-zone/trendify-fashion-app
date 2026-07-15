ALTER TABLE "Order"
ADD COLUMN "reservationExpiresAt" TIMESTAMP(3);

CREATE INDEX "Order_status_reservationExpiresAt_idx"
ON "Order"("status", "reservationExpiresAt");
