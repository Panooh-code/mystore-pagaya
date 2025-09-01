-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  contato TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table (main products)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  modelo TEXT,
  categoria TEXT NOT NULL,
  fornecedor_id UUID REFERENCES public.suppliers(id),
  valor_custo DECIMAL(10,2),
  impostos_percentual DECIMAL(5,2) DEFAULT 0,
  is_consignado BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_variants table (SKUs)
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  referencia TEXT NOT NULL UNIQUE, -- SKU
  cor TEXT,
  tamanho TEXT,
  preco_venda DECIMAL(10,2),
  quantidade_loja INTEGER DEFAULT 0,
  local_loja TEXT,
  quantidade_estoque INTEGER DEFAULT 0,
  local_estoque TEXT,
  foto_url_1 TEXT,
  foto_url_2 TEXT,
  foto_url_3 TEXT,
  foto_url_4 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  employee_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'transferencia', 'perda', 'venda')),
  quantidade INTEGER NOT NULL,
  origem TEXT, -- 'loja', 'estoque', null para entrada
  destino TEXT, -- 'loja', 'estoque', null para saida
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Authenticated users can view suppliers" 
ON public.suppliers FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage suppliers" 
ON public.suppliers FOR ALL 
USING (is_admin());

-- RLS Policies for products
CREATE POLICY "Authenticated users can view products" 
ON public.products FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage products" 
ON public.products FOR ALL 
USING (is_admin());

-- RLS Policies for product_variants
CREATE POLICY "Authenticated users can view variants" 
ON public.product_variants FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage variants" 
ON public.product_variants FOR ALL 
USING (is_admin());

-- RLS Policies for stock_movements
CREATE POLICY "Authenticated users can view stock movements" 
ON public.stock_movements FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create stock movements" 
ON public.stock_movements FOR INSERT 
WITH CHECK (is_admin());

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Anyone can view product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can update product images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can delete product images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'product-images' AND is_admin());

-- Create update triggers for timestamps
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_products_categoria ON public.products(categoria);
CREATE INDEX idx_products_fornecedor ON public.products(fornecedor_id);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_variants_referencia ON public.product_variants(referencia);
CREATE INDEX idx_stock_movements_variant ON public.stock_movements(variant_id);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(created_at);