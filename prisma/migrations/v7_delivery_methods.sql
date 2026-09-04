-- 1. Create delivery_methods table
CREATE TABLE IF NOT EXISTS "delivery_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "country_id" SMALLINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "delivery_methods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_methods_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2. Insert Delivery Methods exclusively for Venezuela (country_id = 1)
-- I am leaving these as readable Spanish strings. If you want translation keys, 
-- you can change them to 'store_pickup', 'national_shipping', etc.
INSERT INTO "delivery_methods" ("country_id", "name", "is_active") VALUES
(1, 'Retiro en tienda o almacén', true),
(1, 'Envío Nacional (Tealca, MRW, Zoom, etc.)', true),
(1, 'Delivery / Entrega local', true),
(1, 'Flete cobro a destino / Cuenta del comprador', true),
(1, 'Flete incluido', true);
