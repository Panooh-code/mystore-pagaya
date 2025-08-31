-- Create a dedicated schema for extensions to improve security
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the http extension to the extensions schema
DROP EXTENSION IF EXISTS http;
CREATE EXTENSION http SCHEMA extensions;

-- Grant usage on the extensions schema to the roles that need it
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Update the notify_new_employee function to use the correct schema path
CREATE OR REPLACE FUNCTION public.notify_new_employee()
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
  END IF;
  
  RETURN NEW;
END;
$$;