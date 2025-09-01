-- Clean up duplicate RLS policies and simplify the system
-- First, drop all existing policies on employees table
DROP POLICY IF EXISTS "Admins can update all employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Main admin always has access" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employee record" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
DROP POLICY IF EXISTS "admin_can_update_all_records" ON public.employees;
DROP POLICY IF EXISTS "admin_can_view_all_records" ON public.employees;
DROP POLICY IF EXISTS "megafoto_admin_full_access" ON public.employees;
DROP POLICY IF EXISTS "user_can_update_own_record" ON public.employees;
DROP POLICY IF EXISTS "user_can_view_own_record" ON public.employees;

-- Create simplified RLS policies that don't query auth.users directly
-- Main admin policy (info@panooh.com gets full access)
CREATE POLICY "main_admin_full_access" ON public.employees
FOR ALL 
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@panooh.com'
)
WITH CHECK (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@panooh.com'
);

-- Users can view and update their own records
CREATE POLICY "users_own_records" ON public.employees
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all employees
CREATE POLICY "admins_view_all" ON public.employees
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can update all employees
CREATE POLICY "admins_update_all" ON public.employees
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admins can delete employees (but not themselves)
CREATE POLICY "admins_delete_others" ON public.employees
FOR DELETE
TO authenticated
USING (is_admin() AND auth.uid() != user_id);

-- Update the is_admin function to be more robust
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role IN ('proprietario', 'gerente') AND status = 'ativo' 
     FROM public.employees 
     WHERE user_id = auth.uid()),
    false
  ) OR 
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@panooh.com';
$$;