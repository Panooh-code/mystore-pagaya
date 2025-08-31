-- Step 1: Confirm the email for info@panooh.com administratively
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now()
WHERE email = 'info@panooh.com';

-- Step 2: Drop the problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employee record" ON public.employees;

-- Step 3: Create a security definer function to safely check user roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role::text FROM public.employees WHERE user_id = auth.uid() AND status = 'ativo';
$$;

-- Step 4: Create a security definer function to check if user is admin
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

-- Step 5: Create new, safe RLS policies
CREATE POLICY "Users can view their own employee record" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all employees" 
ON public.employees 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Users can update their own employee record" 
ON public.employees 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all employees" 
ON public.employees 
FOR UPDATE 
USING (public.is_admin());

-- Step 6: Special policy for the main admin email
CREATE POLICY "Main admin always has access" 
ON public.employees 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'info@panooh.com'
  )
);