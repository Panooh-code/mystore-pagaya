-- Enable RLS on all tables that don't have it (IF NOT EXISTS check)
DO $$
BEGIN
    -- Enable RLS on tables if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables t 
        JOIN pg_class c ON c.relname = t.tablename 
        WHERE t.schemaname = 'public' AND t.tablename = 'products' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables t 
        JOIN pg_class c ON c.relname = t.tablename 
        WHERE t.schemaname = 'public' AND t.tablename = 'product_variants' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables t 
        JOIN pg_class c ON c.relname = t.tablename 
        WHERE t.schemaname = 'public' AND t.tablename = 'suppliers' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables t 
        JOIN pg_class c ON c.relname = t.tablename 
        WHERE t.schemaname = 'public' AND t.tablename = 'employees' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables t 
        JOIN pg_class c ON c.relname = t.tablename 
        WHERE t.schemaname = 'public' AND t.tablename = 'stock_movements' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Drop existing policies for sales table and recreate them
DROP POLICY IF EXISTS "Employees can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Employees can create sales" ON public.sales;
DROP POLICY IF EXISTS "Employees can update their sales" ON public.sales;

-- Create RLS policies for sales table
CREATE POLICY "Employees can view all sales" 
ON public.sales FOR SELECT 
USING (
  EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

CREATE POLICY "Employees can create sales" 
ON public.sales FOR INSERT 
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  ) AND employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can update their sales" 
ON public.sales FOR UPDATE 
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid() AND status = 'ativo'
  ) OR EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND role IN ('proprietario', 'gerente') AND status = 'ativo'
  )
);

-- Drop and recreate policies for other tables
DROP POLICY IF EXISTS "Employees can view products" ON public.products;
DROP POLICY IF EXISTS "Employees can create products" ON public.products;
DROP POLICY IF EXISTS "Employees can update products" ON public.products;

CREATE POLICY "Employees can view products" 
ON public.products FOR SELECT 
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

CREATE POLICY "Employees can create products" 
ON public.products FOR INSERT 
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

CREATE POLICY "Employees can update products" 
ON public.products FOR UPDATE 
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

-- Product variants policies
DROP POLICY IF EXISTS "Employees can view product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Employees can create product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Employees can update product variants" ON public.product_variants;

CREATE POLICY "Employees can view product variants" 
ON public.product_variants FOR SELECT 
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

CREATE POLICY "Employees can create product variants" 
ON public.product_variants FOR INSERT 
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

CREATE POLICY "Employees can update product variants" 
ON public.product_variants FOR UPDATE 
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

-- Suppliers policies
DROP POLICY IF EXISTS "Employees can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Employees can create suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Employees can update suppliers" ON public.suppliers;

CREATE POLICY "Employees can view suppliers" 
ON public.suppliers FOR SELECT 
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

CREATE POLICY "Employees can create suppliers" 
ON public.suppliers FOR INSERT 
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

CREATE POLICY "Employees can update suppliers" 
ON public.suppliers FOR UPDATE 
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

-- Employees policies
DROP POLICY IF EXISTS "Employees can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;

CREATE POLICY "Employees can view all employees" 
ON public.employees FOR SELECT 
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

CREATE POLICY "Admins can manage employees" 
ON public.employees FOR ALL 
USING (
  EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND role IN ('proprietario', 'gerente') AND status = 'ativo'
  )
);

-- Stock movements policies
DROP POLICY IF EXISTS "Employees can view stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Employees can create stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Employees can update their stock movements" ON public.stock_movements;

CREATE POLICY "Employees can view stock movements" 
ON public.stock_movements FOR SELECT 
USING (
  deleted_at IS NULL AND EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  )
);

CREATE POLICY "Employees can create stock movements" 
ON public.stock_movements FOR INSERT 
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.employees 
    WHERE user_id = auth.uid() AND status = 'ativo'
  ) AND employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can update their stock movements" 
ON public.stock_movements FOR UPDATE 
USING (
  deleted_at IS NULL AND (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid() AND status = 'ativo'
    ) OR EXISTS(
      SELECT 1 FROM public.employees 
      WHERE user_id = auth.uid() AND role IN ('proprietario', 'gerente') AND status = 'ativo'
    )
  )
);