-- ============================================================
-- Bitobbu DB V6 Migration
-- Run manually: BEGIN; ... COMMIT; wrapped for safety
-- ============================================================

BEGIN;

-- ============================================================
-- [1] New table: user_onboarding_status
-- ============================================================
CREATE TABLE IF NOT EXISTS user_onboarding_status (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id             UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_name            VARCHAR(100) NOT NULL,
    has_completed_tutorial BOOLEAN     NOT NULL DEFAULT false,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, company_id, module_name)
);

-- ============================================================
-- [2] New table: payment_conditions
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_conditions (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en     VARCHAR(100) NOT NULL UNIQUE,
    name_es     VARCHAR(100) NOT NULL UNIQUE,
    days_to_due INTEGER      NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true
);

-- ============================================================
-- [2b] Seed payment_conditions
-- ============================================================
INSERT INTO payment_conditions (name_en, name_es, days_to_due, description, is_active) VALUES
    ('Cash',                'Contado',          0,  'Immediate payment at the time of purchase',          true),
    ('15-Day Credit',       'Crédito 15 días',  15, 'Payment due within 15 days of invoice',              true),
    ('30-Day Credit',       'Crédito 30 días',  30, 'Payment due within 30 days of invoice',              true),
    ('60-Day Credit',       'Crédito 60 días',  60, 'Payment due within 60 days of invoice',              true),
    ('50% Advance Payment', '50% Adelanto',     0,  '50% paid upfront before delivery, 50% on delivery',  true)
ON CONFLICT (name_en) DO NOTHING;

-- ============================================================
-- [3] New table: estimated_monthly_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS estimated_monthly_transactions (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    range_name     VARCHAR(50) NOT NULL UNIQUE,
    description    TEXT,
    description_es TEXT
);

-- ============================================================
-- [4] New table: company_sizes
-- ============================================================
CREATE TABLE IF NOT EXISTS company_sizes (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    size_name        VARCHAR(50)  NOT NULL UNIQUE,
    display_label    VARCHAR(100) NOT NULL,
    display_label_es VARCHAR(100) NOT NULL,
    is_active        BOOLEAN      NOT NULL DEFAULT true
);

-- ============================================================
-- [5] Seed estimated_monthly_transactions
-- ============================================================
INSERT INTO estimated_monthly_transactions (range_name, description, description_es) VALUES
    ('less_than_50',  'Less than 50 operations',    'Menos de 50 operaciones'),
    ('51_to_200',     '51 to 200 operations',       '51 a 200 operaciones'),
    ('more_than_200', 'More than 200 operations',   'Más de 200 operaciones')
ON CONFLICT (range_name) DO NOTHING;

-- ============================================================
-- [6] Seed company_sizes
-- ============================================================
INSERT INTO company_sizes (size_name, display_label, display_label_es, is_active) VALUES
    ('entrepreneur', 'Entrepreneur', 'Emprendedor', true),
    ('small',        'Small',        'Pequeña',     true),
    ('medium',       'Medium',       'Mediana',     true),
    ('large',        'Large',        'Grande',      true)
ON CONFLICT (size_name) DO NOTHING;

-- ============================================================
-- [6b] New table: subscription_plans
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name     VARCHAR(100)   NOT NULL UNIQUE,
    price         DECIMAL(10, 2) NOT NULL,
    billing_cycle INTEGER        NOT NULL,  -- number of days
    is_active     BOOLEAN        NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Seed default plans
INSERT INTO subscription_plans (plan_name, price, billing_cycle, is_active) VALUES
    ('Free',    0.00,  30,  true),
    ('Premium', 29.99, 30,  true)
ON CONFLICT (plan_name) DO NOTHING;

-- ============================================================
-- [7] Add new columns to companies
-- ============================================================
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS is_founder_badge         BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS founding_year            SMALLINT,
    ADD COLUMN IF NOT EXISTS monthly_transactions_id  UUID REFERENCES estimated_monthly_transactions(id),
    ADD COLUMN IF NOT EXISTS company_size_id          UUID REFERENCES company_sizes(id);

-- ============================================================
-- [7b] Add payment_condition_id FK to requests, quote_responses, transactions
-- ============================================================
ALTER TABLE requests
    ADD COLUMN IF NOT EXISTS payment_condition_id UUID REFERENCES payment_conditions(id) ON DELETE SET NULL;

ALTER TABLE quote_responses
    ADD COLUMN IF NOT EXISTS payment_condition_id UUID REFERENCES payment_conditions(id) ON DELETE SET NULL;

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS payment_condition_id UUID REFERENCES payment_conditions(id) ON DELETE SET NULL;

-- ============================================================
-- [8] Data migration: copy founder_badge -> companies.is_founder_badge
-- Only from the most recent active subscription per company
-- ============================================================
UPDATE companies c
SET is_founder_badge = s.founder_badge
FROM (
    SELECT DISTINCT ON (company_id) company_id, founder_badge
    FROM subscriptions
    ORDER BY company_id, created_at DESC
) s
WHERE s.company_id = c.id;

-- ============================================================
-- [9] Drop founder_badge from subscriptions
-- ============================================================
ALTER TABLE subscriptions DROP COLUMN IF EXISTS founder_badge;

-- ============================================================
-- [9b] Migrate subscriptions.plan (PlanType enum) to plan_id FK
-- ============================================================
-- Step 1: add the new FK column
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS plan_id UUID;

-- Step 2: link existing rows to the seeded plans
UPDATE subscriptions s
SET plan_id = sp.id
FROM subscription_plans sp
WHERE sp.plan_name = initcap(s.plan::text);  -- maps 'free' -> 'Free', 'premium' -> 'Premium'

-- Step 3: set NOT NULL and add FK constraint (now all rows are filled)
ALTER TABLE subscriptions
    ALTER COLUMN plan_id SET NOT NULL,
    ADD CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);

-- Step 4: drop the old enum column
ALTER TABLE subscriptions DROP COLUMN IF EXISTS plan;

-- ============================================================
-- [10] Enum renames: Capital Case / Mixed -> lowercase snake_case
--      Postgres 10+ supports ALTER TYPE ... RENAME VALUE
-- ============================================================

-- CompanyVolume
ALTER TYPE "CompanyVolume" RENAME VALUE 'Small'  TO 'small';
ALTER TYPE "CompanyVolume" RENAME VALUE 'Medium' TO 'medium';
ALTER TYPE "CompanyVolume" RENAME VALUE 'Large'  TO 'large';

-- VerificationStatus
ALTER TYPE "VerificationStatus" RENAME VALUE 'Pending'      TO 'pending';
ALTER TYPE "VerificationStatus" RENAME VALUE 'Under_Review' TO 'under_review';
ALTER TYPE "VerificationStatus" RENAME VALUE 'Verified'     TO 'verified';
ALTER TYPE "VerificationStatus" RENAME VALUE 'Rejected'     TO 'rejected';

-- RequestType
-- (PlanType is dropped below — column already migrated to plan_id FK)

-- RequestStatus
ALTER TYPE "RequestStatus" RENAME VALUE 'Active'        TO 'active';
ALTER TYPE "RequestStatus" RENAME VALUE 'Paused'        TO 'paused';
ALTER TYPE "RequestStatus" RENAME VALUE 'Expired'       TO 'expired';
ALTER TYPE "RequestStatus" RENAME VALUE 'Completed'     TO 'completed';
ALTER TYPE "RequestStatus" RENAME VALUE 'Expiring_Soon' TO 'expiring_soon';
ALTER TYPE "RequestStatus" RENAME VALUE 'Closed'        TO 'closed';

-- ResponseStatus
ALTER TYPE "ResponseStatus" RENAME VALUE 'Pending'     TO 'pending';
ALTER TYPE "ResponseStatus" RENAME VALUE 'Accepted'    TO 'accepted';
ALTER TYPE "ResponseStatus" RENAME VALUE 'Rejected'    TO 'rejected';
ALTER TYPE "ResponseStatus" RENAME VALUE 'Negotiating' TO 'negotiating';
ALTER TYPE "ResponseStatus" RENAME VALUE 'Expired'     TO 'expired';

-- TransactionStatus
ALTER TYPE "TransactionStatus" RENAME VALUE 'In_Process' TO 'in_process';
ALTER TYPE "TransactionStatus" RENAME VALUE 'Completed'  TO 'completed';
ALTER TYPE "TransactionStatus" RENAME VALUE 'Canceled'   TO 'canceled';
ALTER TYPE "TransactionStatus" RENAME VALUE 'In_Dispute' TO 'in_dispute';

-- VerifDocStatus
ALTER TYPE "VerifDocStatus" RENAME VALUE 'Pending'  TO 'pending';
ALTER TYPE "VerifDocStatus" RENAME VALUE 'Approved' TO 'approved';
ALTER TYPE "VerifDocStatus" RENAME VALUE 'Rejected' TO 'rejected';

-- RequestType
ALTER TYPE "RequestType" RENAME VALUE 'Product' TO 'product';
ALTER TYPE "RequestType" RENAME VALUE 'Service' TO 'service';

-- ============================================================
-- [11] Drop PlanType enum (column already migrated to plan_id FK)
-- ============================================================
DROP TYPE IF EXISTS "PlanType";

COMMIT;
