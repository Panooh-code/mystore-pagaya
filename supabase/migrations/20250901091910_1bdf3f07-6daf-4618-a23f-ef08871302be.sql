-- Corrigir a associação do user_id para o administrador principal
UPDATE employees 
SET user_id = 'effa4b65-be8c-4082-aded-6d62f96593ab'
WHERE email = 'info@panooh.com' AND user_id != 'effa4b65-be8c-4082-aded-6d62f96593ab';