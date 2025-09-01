-- CORREÇÃO DEFINITIVA: Eliminar recursão infinita nas políticas RLS da tabela employees

-- Remover todas as políticas existentes que causam recursão
DROP POLICY IF EXISTS "employees_select_non_recursive" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_non_recursive" ON public.employees;  
DROP POLICY IF EXISTS "employees_update_non_recursive" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_non_recursive" ON public.employees;

-- Garantir que is_super_admin funciona corretamente
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'info@panooh.com'
  );
$$;

-- Criar função SECURITY DEFINER para verificar role sem RLS (SEM RECURSÃO)
CREATE OR REPLACE FUNCTION public.get_user_role_no_rls(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.employees 
  WHERE user_id = user_uuid 
  AND status = 'ativo' 
  AND deleted_at IS NULL 
  LIMIT 1;
$$;

-- POLÍTICAS COMPLETAMENTE SEM RECURSÃO - usando apenas funções SECURITY DEFINER

-- SELECT: Super admin OU próprio registro OU admin/gerente verificado via função
CREATE POLICY "employees_select_final" 
ON public.employees 
FOR SELECT 
USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    user_id = auth.uid() OR
    get_user_role_no_rls(auth.uid()) IN ('proprietario', 'gerente')
  )
);

-- INSERT: Super admin OU proprietário verificado via função  
CREATE POLICY "employees_insert_final" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  is_super_admin() OR
  get_user_role_no_rls(auth.uid()) = 'proprietario'
);

-- UPDATE: Super admin OU proprietário pode tudo OU gerente pode vendedor
CREATE POLICY "employees_update_final" 
ON public.employees 
FOR UPDATE 
USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    get_user_role_no_rls(auth.uid()) = 'proprietario' OR
    (role = 'vendedor' AND get_user_role_no_rls(auth.uid()) = 'gerente')
  )
)
WITH CHECK (
  is_super_admin() OR
  get_user_role_no_rls(auth.uid()) = 'proprietario' OR
  (role = 'vendedor' AND get_user_role_no_rls(auth.uid()) = 'gerente')
);

-- DELETE: Super admin OU proprietário
CREATE POLICY "employees_delete_final" 
ON public.employees 
FOR DELETE 
USING (
  is_super_admin() OR
  get_user_role_no_rls(auth.uid()) = 'proprietario'
);

-- Atualizar get_current_user_role para usar a função sem RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN is_super_admin() THEN 'proprietario'
    ELSE get_user_role_no_rls(auth.uid())
  END;
$$;