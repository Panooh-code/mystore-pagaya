-- Enable RLS on all tables that don't have it
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for products table
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

-- Create RLS policies for product_variants table
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

-- Create RLS policies for suppliers table
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

-- Create RLS policies for employees table
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

-- Create RLS policies for stock_movements table
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