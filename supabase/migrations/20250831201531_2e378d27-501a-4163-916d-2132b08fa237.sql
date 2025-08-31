-- Create webhook to notify when new employee is created with pending status
CREATE OR REPLACE FUNCTION notify_new_employee()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only notify for new employees with pending status
  IF NEW.status = 'pendente' THEN
    SELECT net.http_post(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger to call the notification function
CREATE TRIGGER trigger_notify_new_employee
  AFTER INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_employee();