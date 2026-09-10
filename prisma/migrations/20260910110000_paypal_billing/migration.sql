-- Subscription: drop the Stripe customer concept (PayPal subscriptions have
-- no equivalent pre-checkout customer object), rename the provider ref.
ALTER TABLE "subscriptions" DROP COLUMN "stripeCustomerId";
ALTER TABLE "subscriptions" RENAME COLUMN "stripeSubscriptionId" TO "paypalSubscriptionId";

ALTER TABLE "addon_subscriptions" DROP COLUMN "stripeCustomerId";
ALTER TABLE "addon_subscriptions" RENAME COLUMN "stripeSubscriptionId" TO "paypalSubscriptionId";

ALTER TABLE "payments" RENAME COLUMN "stripeInvoiceId" TO "paypalTransactionId";
