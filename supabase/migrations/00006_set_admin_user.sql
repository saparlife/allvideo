-- Set admin role for saparlife@gmail.com
UPDATE users
SET role = 'admin', updated_at = now()
WHERE email = 'saparlife@gmail.com';
