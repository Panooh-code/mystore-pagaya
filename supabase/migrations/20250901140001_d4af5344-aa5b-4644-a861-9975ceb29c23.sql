-- Fix remaining functions that might be missing search_path
CREATE OR REPLACE FUNCTION public.soft_delete(table_name text, record_id uuid, deleted_by_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.%I SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL',
    table_name
  ) USING deleted_by_user, record_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_deleted(table_name text, record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.%I SET deleted_at = NULL, deleted_by = NULL WHERE id = $1',
    table_name
  ) USING record_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.employees (user_id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_megafoto_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the Megafoto admin email
  IF NEW.email = 'info@panooh.com' THEN
    -- Update the employee record to be proprietario and ativo
    UPDATE public.employees 
    SET role = 'proprietario', status = 'ativo'
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pending_employees_count()
RETURNS integer
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.employees WHERE status = 'pendente';
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
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