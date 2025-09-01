-- Fix the security warnings by setting proper search_path for the functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public.employees WHERE user_id = auth.uid() AND status = 'ativo';
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() 
    AND role IN ('proprietario', 'gerente') 
    AND status = 'ativo'
  );
$$;