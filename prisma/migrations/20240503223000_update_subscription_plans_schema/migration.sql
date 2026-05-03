-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN "name_es" VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE "subscription_plans" ADD COLUMN "trial_days" SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE "subscription_plans" ADD COLUMN "max_rfq_per_month" INTEGER;
ALTER TABLE "subscription_plans" ADD COLUMN "max_quotes_per_month" INTEGER;
ALTER TABLE "subscription_plans" ADD COLUMN "max_active_offers" INTEGER;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "trial_ends_at" TIMESTAMPTZ;
ALTER TABLE "subscriptions" ADD COLUMN "current_period_start" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "subscriptions" ADD COLUMN "current_period_end" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "subscriptions" ADD COLUMN "rfq_count_current" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "subscriptions" ADD COLUMN "quotes_count_current" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "subscriptions_company_id_is_active_idx" ON "subscriptions"("company_id", "is_active");

-- CreateUniqueIndex where is_active = true
CREATE UNIQUE INDEX "subscriptions_one_active_per_company" ON "subscriptions"("company_id") WHERE is_active = true;

-- Data Seeding
UPDATE "subscription_plans" SET "name_es" = 'Gratis', "trial_days" = 0, "max_rfq_per_month" = 3, "max_quotes_per_month" = 10, "max_active_offers" = 1 WHERE "plan_name" = 'Free';
UPDATE "subscription_plans" SET "name_es" = 'Básico', "trial_days" = 14, "max_rfq_per_month" = 10, "max_quotes_per_month" = 50, "max_active_offers" = 5 WHERE "plan_name" = 'Starter';
UPDATE "subscription_plans" SET "name_es" = 'Pro', "trial_days" = 30, "max_rfq_per_month" = NULL, "max_quotes_per_month" = NULL, "max_active_offers" = NULL WHERE "plan_name" = 'Pro';

-- Backfill current_period_end for existing active subscriptions to 1 year from now
UPDATE "subscriptions" SET "current_period_end" = CURRENT_TIMESTAMP + INTERVAL '1 year' WHERE "is_active" = true;
