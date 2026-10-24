-- Idempotent backfill: populate password_history with the existing password for users who don't have any history record yet.
INSERT INTO password_history (id, user_id, password_hash, created_at)
SELECT gen_random_uuid(), u.id, u.password, NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM password_history ph WHERE ph.user_id = u.id
);

