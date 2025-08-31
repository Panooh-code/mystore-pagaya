-- Step 1: Confirm the email for info@panooh.com administratively
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'info@panooh.com';

-- Step 2: Drop ALL existing RLS policies for employees table
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employee record" ON public.employees;
DROP POLICY IF EXISTS "Admins can update all employees" ON public.employees;
DROP POLICY IF EXISTS "Main admin always has access" ON public.employees;

-- Step 3: Create security definer functions to safely check user roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role::text FROM public.employees WHERE user_id = auth.uid() AND status = 'ativo';
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() 
    AND role IN ('proprietario', 'gerente') 
    AND status = 'ativo'
  );
$$;

-- Step 4: Create completely new, safe RLS policies
CREATE POLICY "user_can_view_own_record" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "admin_can_view_all_records" 
ON public.employees 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "user_can_update_own_record" 
ON public.employees 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "admin_can_update_all_records" 
ON public.employees 
FOR UPDATE 
USING (public.is_admin());

-- Step 5: Special policy for the main admin email (info@panooh.com)
CREATE POLICY "megafoto_admin_full_access" 
ON public.employees 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'info@panooh.com'
  )
);