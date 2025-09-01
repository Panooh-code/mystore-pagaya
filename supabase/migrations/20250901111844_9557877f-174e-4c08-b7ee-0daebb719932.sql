-- Remove todas as políticas RLS de todas as tabelas do sistema
-- Desabilita RLS temporariamente em todas as tabelas

DO $$
DECLARE
    policy_record RECORD;
    table_name TEXT;
BEGIN
    -- Lista de todas as tabelas que têm RLS
    FOR table_name IN VALUES ('employees'), ('products'), ('product_variants'), ('suppliers'), ('stock_movements')
    LOOP
        -- Remove todas as políticas da tabela atual
        FOR policy_record IN 
            SELECT schemaname, tablename, policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = table_name
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                          policy_record.policyname, 
                          policy_record.schemaname, 
                          policy_record.tablename);
            
            RAISE NOTICE 'Dropped policy % on table %', policy_record.policyname, policy_record.tablename;
        END LOOP;
        
        -- Desabilita RLS na tabela
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Disabled RLS on table %', table_name;
    END LOOP;
END
$$;

-- Confirma que todas as políticas foram removidas
SELECT 
    schemaname, 
    tablename, 
    COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY schemaname, tablename;