-- Create function to automatically set Megafoto user as proprietario when they sign up
CREATE OR REPLACE FUNCTION public.handle_megafoto_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Create trigger to run after employee insert
CREATE OR REPLACE TRIGGER trigger_megafoto_admin
  AFTER INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_megafoto_admin();