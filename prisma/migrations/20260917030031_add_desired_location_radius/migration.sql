-- AlterTable
ALTER TABLE "candidate_profiles" ADD COLUMN     "desiredLocationRadiusMiles" INTEGER;

-- RenameIndex
ALTER INDEX "addon_subscriptions_stripeSubscriptionId_key" RENAME TO "addon_subscriptions_paypalSubscriptionId_key";

-- RenameIndex
ALTER INDEX "payments_stripeInvoiceId_key" RENAME TO "payments_paypalTransactionId_key";

-- RenameIndex
ALTER INDEX "subscriptions_stripeSubscriptionId_key" RENAME TO "subscriptions_paypalSubscriptionId_key";
