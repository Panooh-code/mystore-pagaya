-- Step 1: Remove the problematic trigger that's blocking registration
DROP TRIGGER IF EXISTS trigger_notify_new_employee ON public.employees;

-- Step 2: Create a more robust notification function that won't block registration
CREATE OR REPLACE FUNCTION public.notify_new_employee_safe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public,extensions'
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only notify for new employees with pending status
  IF NEW.status = 'pendente' THEN
    BEGIN
      -- Try to send notification, but don't fail the entire operation if it doesn't work
      SELECT extensions.http_post(
        url := 'https://zfechqqdjryaiiynsxxf.supabase.co/functions/v1/notify-new-user',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZWNocXFkanJ5YWlpeW5zeHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NjkwMjAsImV4cCI6MjA3MjI0NTAyMH0.RW-dDx-z3z992XOzqJ2DrXM3uF1_m6WVEROrlyqkpi0"}'::jsonb,
        body := json_build_object(
          'type', 'INSERT',
          'table', 'employees',
          'record', row_to_json(NEW),
          'old_record', NULL
        )::jsonb
      ) INTO request_id;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the trigger
        RAISE WARNING 'Failed to send notification for new employee: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create the trigger again with the safer function
CREATE TRIGGER trigger_notify_new_employee_safe
  AFTER INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_employee_safe();