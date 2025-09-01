-- Force clean up all RLS policies on employees table
-- Get all existing policies first and drop them systematically
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on employees table
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'employees'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END
$$;

-- Create simplified RLS policies
-- Main admin policy (info@panooh.com gets full access)
CREATE POLICY "main_admin_access" ON public.employees
FOR ALL 
TO authenticated
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'info@panooh.com')
)
WITH CHECK (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'info@panooh.com')
);

-- Users can view and update their own records
CREATE POLICY "own_record_access" ON public.employees
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all employees
CREATE POLICY "admin_view_all" ON public.employees
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can update all employees
CREATE POLICY "admin_update_all" ON public.employees
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admins can delete employees (but not themselves)
CREATE POLICY "admin_delete_others" ON public.employees
FOR DELETE
TO authenticated
USING (is_admin() AND auth.uid() != user_id);

-- Update the is_admin function to be more robust and avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    EXISTS(
      SELECT 1 FROM public.employees 
      WHERE user_id = auth.uid() 
      AND role IN ('proprietario', 'gerente') 
      AND status = 'ativo'
    ),
    false
  ) OR 
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'info@panooh.com');
$$;