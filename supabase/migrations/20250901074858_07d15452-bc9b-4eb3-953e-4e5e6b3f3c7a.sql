-- Create function to count pending employees
CREATE OR REPLACE FUNCTION public.get_pending_employees_count()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.employees WHERE status = 'pendente';
$$;