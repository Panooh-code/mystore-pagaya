-- Fix all functions to have proper search_path by recreating triggers and functions
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Create the function with proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();