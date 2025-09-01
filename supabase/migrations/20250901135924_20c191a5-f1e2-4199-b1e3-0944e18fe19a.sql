-- Fix security warnings by updating function search paths
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'info@panooh.com');
END;
$$;

-- Also update the notify_new_employee_safe function to fix search path
CREATE OR REPLACE FUNCTION public.notify_new_employee_safe()
RETURNS trigger
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