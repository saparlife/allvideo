-- Fix handle_new_user trigger to save username from registration

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'username'
  );

  -- Create free subscription
  INSERT INTO public.subscriptions (user_id, tier, storage_limit_gb, bandwidth_limit_gb)
  VALUES (NEW.id, 'free', 10, 100);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update existing users who have username in auth metadata but not in public.users
UPDATE public.users u
SET username = (
  SELECT raw_user_meta_data->>'username'
  FROM auth.users a
  WHERE a.id = u.id
)
WHERE u.username IS NULL
AND EXISTS (
  SELECT 1 FROM auth.users a
  WHERE a.id = u.id
  AND a.raw_user_meta_data->>'username' IS NOT NULL
);
