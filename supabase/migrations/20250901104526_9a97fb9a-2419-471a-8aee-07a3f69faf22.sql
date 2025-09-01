-- Add audit fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.employees(id);

-- Add tax field to product_variants table  
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS impostos_percentual NUMERIC DEFAULT 0;

-- Add audit fields to product_variants table
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.employees(id);

-- Create index for better performance on created_by fields
CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);
CREATE INDEX IF NOT EXISTS idx_product_variants_created_by ON public.product_variants(created_by);

-- Add RLS policies for the new audit fields
CREATE POLICY "Users can view products with created_by" ON public.products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view variants with created_by" ON public.product_variants FOR SELECT USING (auth.uid() IS NOT NULL);