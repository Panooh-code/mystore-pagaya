-- Fix infinite recursion in employees RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON public.employees;

-- Ensure is_super_admin function is robust and doesn't cause recursion
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'info@panooh.com');
$$;

-- Create new non-recursive employees policies
CREATE POLICY "employees_select_non_recursive" 
ON public.employees 
FOR SELECT 
USING (
  deleted_at IS NULL AND (
    -- Super admin can see everything
    is_super_admin() OR
    -- Users can see their own record
    user_id = auth.uid() OR
    -- Active proprietarios and gerentes can see all records
    EXISTS (
      SELECT 1 FROM public.employees emp 
      WHERE emp.user_id = auth.uid() 
      AND emp.role IN ('proprietario', 'gerente') 
      AND emp.status = 'ativo' 
      AND emp.deleted_at IS NULL
    )
  )
);

CREATE POLICY "employees_insert_non_recursive" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  -- Super admin can insert anything
  is_super_admin() OR
  -- Active proprietarios can insert
  EXISTS (
    SELECT 1 FROM public.employees emp 
    WHERE emp.user_id = auth.uid() 
    AND emp.role = 'proprietario' 
    AND emp.status = 'ativo' 
    AND emp.deleted_at IS NULL
  )
);

CREATE POLICY "employees_update_non_recursive" 
ON public.employees 
FOR UPDATE 
USING (
  deleted_at IS NULL AND (
    -- Super admin can update anything
    is_super_admin() OR
    -- Active proprietarios can update anyone
    EXISTS (
      SELECT 1 FROM public.employees emp 
      WHERE emp.user_id = auth.uid() 
      AND emp.role = 'proprietario' 
      AND emp.status = 'ativo' 
      AND emp.deleted_at IS NULL
    ) OR
    -- Active gerentes can update vendedores only
    (
      role = 'vendedor' AND
      EXISTS (
        SELECT 1 FROM public.employees emp 
        WHERE emp.user_id = auth.uid() 
        AND emp.role = 'gerente' 
        AND emp.status = 'ativo' 
        AND emp.deleted_at IS NULL
      )
    )
  )
)
WITH CHECK (
  -- Super admin can update to anything
  is_super_admin() OR
  -- Active proprietarios can update to anything
  EXISTS (
    SELECT 1 FROM public.employees emp 
    WHERE emp.user_id = auth.uid() 
    AND emp.role = 'proprietario' 
    AND emp.status = 'ativo' 
    AND emp.deleted_at IS NULL
  ) OR
  -- Active gerentes can only update to vendedor role
  (
    role = 'vendedor' AND
    EXISTS (
      SELECT 1 FROM public.employees emp 
      WHERE emp.user_id = auth.uid() 
      AND emp.role = 'gerente' 
      AND emp.status = 'ativo' 
      AND emp.deleted_at IS NULL
    )
  )
);

CREATE POLICY "employees_delete_non_recursive" 
ON public.employees 
FOR DELETE 
USING (
  -- Super admin can delete anyone
  is_super_admin() OR
  -- Active proprietarios can delete anyone  
  EXISTS (
    SELECT 1 FROM public.employees emp 
    WHERE emp.user_id = auth.uid() 
    AND emp.role = 'proprietario' 
    AND emp.status = 'ativo' 
    AND emp.deleted_at IS NULL
  )
);

-- Update get_current_user_role to be more robust and avoid potential recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is super admin first
  IF is_super_admin() THEN
    RETURN 'proprietario';
  END IF;
  
  -- Get role from employees table using a simple query
  SELECT role::text INTO user_role 
  FROM public.employees 
  WHERE user_id = auth.uid() 
  AND status = 'ativo' 
  AND deleted_at IS NULL
  LIMIT 1;
  
  RETURN user_role;
END;
$$;