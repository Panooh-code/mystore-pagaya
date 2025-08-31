-- Enable the http extension to create the net schema
-- This is required for the notify_new_employee function to work properly
CREATE EXTENSION IF NOT EXISTS http;