-- Seed: notification_types
-- Run once in DB or add to migration
INSERT INTO notification_types (id, name, icon) VALUES
    (1, 'negotiation',        'handshake'),
    (2, 'quote_accepted',     'check-circle'),
    (3, 'payment_uploaded',   'credit-card'),
    (4, 'order_shipped',      'truck'),
    (5, 'delivery_confirmed', 'package-check'),
    (6, 'general',            'bell')
ON CONFLICT (id) DO NOTHING;
