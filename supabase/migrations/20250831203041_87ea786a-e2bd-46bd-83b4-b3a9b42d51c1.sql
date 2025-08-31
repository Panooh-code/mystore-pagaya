-- Insert Megafoto user as super admin in employees table
-- This will be the admin user for testing and development
INSERT INTO public.employees (
  user_id,
  nome_completo,
  email,
  role,
  status
) VALUES (
  gen_random_uuid(), -- Generate a UUID for user_id (will be updated when user actually signs up)
  'Megafoto',
  'info@panooh.com',
  'proprietario',
  'ativo'
) ON CONFLICT (email) DO UPDATE SET
  role = 'proprietario',
  status = 'ativo';