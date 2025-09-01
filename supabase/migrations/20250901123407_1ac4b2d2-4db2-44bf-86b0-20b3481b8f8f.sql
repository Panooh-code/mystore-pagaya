-- Create ENUMs for PDV system
CREATE TYPE public.sale_type AS ENUM ('VENDA', 'DEVOLUCAO', 'TROCA');
CREATE TYPE public.stock_movement_type AS ENUM ('VENDA', 'DEVOLUCAO_LOJA', 'DEVOLUCAO_FORNECEDOR', 'TRANSFERENCIA_ENTRADA', 'TRANSFERENCIA_SAIDA', 'AJUSTE_INICIAL');

-- Create sales table
CREATE TABLE public.sales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fatura_numero TEXT NOT NULL,
    desconto_percentual NUMERIC(5, 2) DEFAULT 0,
    tipo_transacao public.sale_type DEFAULT 'VENDA',
    total_venda NUMERIC(10, 2) NOT NULL DEFAULT 0,
    employee_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- Enable RLS on sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Add columns to existing stock_movements table
ALTER TABLE public.stock_movements 
ADD COLUMN tipo_movimento public.stock_movement_type,
ADD COLUMN sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL;

-- Migrate existing data from tipo to tipo_movimento
UPDATE public.stock_movements 
SET tipo_movimento = CASE 
    WHEN tipo = 'entrada' THEN 'AJUSTE_INICIAL'::public.stock_movement_type
    WHEN tipo = 'saida' THEN 'VENDA'::public.stock_movement_type
    WHEN tipo = 'transferencia' THEN 'TRANSFERENCIA_ENTRADA'::public.stock_movement_type
    ELSE 'AJUSTE_INICIAL'::public.stock_movement_type
END
WHERE tipo_movimento IS NULL;

-- Make tipo_movimento NOT NULL after migration
ALTER TABLE public.stock_movements 
ALTER COLUMN tipo_movimento SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE public.stock_movements 
ADD CONSTRAINT fk_stock_movements_variant 
FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- Create trigger for sales updated_at
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sales_employee_id ON public.sales(employee_id);
CREATE INDEX idx_sales_tipo_transacao ON public.sales(tipo_transacao);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);
CREATE INDEX idx_stock_movements_sale_id ON public.stock_movements(sale_id);
CREATE INDEX idx_stock_movements_tipo_movimento ON public.stock_movements(tipo_movimento);