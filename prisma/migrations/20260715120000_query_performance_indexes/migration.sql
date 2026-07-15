CREATE INDEX "user_role_deletedAt_createdAt_idx"
ON "user"("role", "deletedAt", "createdAt");

CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX "Payment_status_paidAt_idx" ON "Payment"("status", "paidAt");

CREATE INDEX "PromotionRedemption_redeemedAt_idx"
ON "PromotionRedemption"("redeemedAt");
