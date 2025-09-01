-- Adicionar colunas de soft delete em todas as tabelas principais
ALTER TABLE public.products 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN deleted_by UUID NULL;

ALTER TABLE public.product_variants 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN deleted_by UUID NULL;

ALTER TABLE public.suppliers 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN deleted_by UUID NULL;

ALTER TABLE public.employees 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN deleted_by UUID NULL;

ALTER TABLE public.stock_movements 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN deleted_by UUID NULL;

-- Criar função helper para soft delete
CREATE OR REPLACE FUNCTION public.soft_delete(
  table_name TEXT,
  record_id UUID,
  deleted_by_user UUID
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.%I SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL',
    table_name
  ) USING deleted_by_user, record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para restaurar registros soft-deleted
CREATE OR REPLACE FUNCTION public.restore_deleted(
  table_name TEXT,
  record_id UUID
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.%I SET deleted_at = NULL, deleted_by = NULL WHERE id = $1',
    table_name
  ) USING record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentar as novas colunas
COMMENT ON COLUMN public.products.deleted_at IS 'Timestamp de quando o produto foi marcado como excluído (soft delete)';
COMMENT ON COLUMN public.products.deleted_by IS 'ID do usuário que excluiu o produto';
COMMENT ON COLUMN public.product_variants.deleted_at IS 'Timestamp de quando a variante foi marcada como excluída (soft delete)';
COMMENT ON COLUMN public.product_variants.deleted_by IS 'ID do usuário que excluiu a variante';
COMMENT ON COLUMN public.suppliers.deleted_at IS 'Timestamp de quando o fornecedor foi marcado como excluído (soft delete)';
COMMENT ON COLUMN public.suppliers.deleted_by IS 'ID do usuário que excluiu o fornecedor';
COMMENT ON COLUMN public.employees.deleted_at IS 'Timestamp de quando o funcionário foi marcado como excluído (soft delete)';
COMMENT ON COLUMN public.employees.deleted_by IS 'ID do usuário que excluiu o funcionário';
COMMENT ON COLUMN public.stock_movements.deleted_at IS 'Timestamp de quando o movimento foi marcado como excluído (soft delete)';
COMMENT ON COLUMN public.stock_movements.deleted_by IS 'ID do usuário que excluiu o movimento';