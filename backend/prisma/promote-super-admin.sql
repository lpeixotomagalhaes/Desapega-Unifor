-- Promove lpeixotomagalhaes@gmail.com a SUPER_ADMIN
UPDATE "User"
SET "role" = 'SUPER_ADMIN',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE lower("email") = lower('lpeixotomagalhaes@gmail.com');

-- Confirmação
SELECT id, name, email, role
FROM "User"
WHERE lower("email") = lower('lpeixotomagalhaes@gmail.com');
