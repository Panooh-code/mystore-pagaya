-- First, let's drop existing problematic policies that will be replaced
DROP POLICY IF EXISTS "Employees can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view products" ON public.products;
DROP POLICY IF EXISTS "Employees can create products" ON public.products;
DROP POLICY IF EXISTS "Employees can update products" ON public.products;
DROP POLICY IF EXISTS "Employees can view product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Employees can create product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Employees can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Employees can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Employees can create suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Employees can update suppliers" ON public.suppliers;

-- Update the helper function to properly handle super admin
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is super admin first
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'info@panooh.com') THEN
    RETURN 'proprietario';
  END IF;
  
  -- Get role from employees table
  SELECT role::text INTO user_role 
  FROM public.employees 
  WHERE user_id = auth.uid() AND status = 'ativo';
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'info@panooh.com');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- =====================================================
-- EMPLOYEES TABLE POLICIES
-- =====================================================

-- Employees: SELECT - Active employees can view all employees
CREATE POLICY "employees_select_policy" ON public.employees
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.employees emp 
      WHERE emp.user_id = auth.uid() 
      AND emp.status = 'ativo' 
      AND emp.deleted_at IS NULL
    )
  )
);

-- Employees: INSERT - Only owners can create employees
CREATE POLICY "employees_insert_policy" ON public.employees
FOR INSERT WITH CHECK (
  is_super_admin() OR
  get_current_user_role() = 'proprietario'
);

-- Employees: UPDATE - Owners can update all, managers can only update vendedor status
CREATE POLICY "employees_update_policy" ON public.employees
FOR UPDATE USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    get_current_user_role() = 'proprietario' OR
    (get_current_user_role() = 'gerente' AND role = 'vendedor')
  )
) WITH CHECK (
  is_super_admin() OR
  get_current_user_role() = 'proprietario' OR
  (get_current_user_role() = 'gerente' AND role = 'vendedor')
);

-- Employees: DELETE - Only owners (soft delete via function)
CREATE POLICY "employees_delete_policy" ON public.employees
FOR DELETE USING (
  is_super_admin() OR
  get_current_user_role() = 'proprietario'
);

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- Products: SELECT - All active employees can view products
CREATE POLICY "products_select_policy" ON public.products
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE user_id = auth.uid() 
      AND status = 'ativo' 
      AND deleted_at IS NULL
    )
  )
);

-- Products: INSERT - Only managers and owners can create products
CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT WITH CHECK (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente')
);

-- Products: UPDATE - Owners full access, managers restricted on valor_custo and impostos_percentual
CREATE POLICY "products_update_policy" ON public.products
FOR UPDATE USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    get_current_user_role() IN ('proprietario', 'gerente')
  )
) WITH CHECK (
  is_super_admin() OR
  get_current_user_role() = 'proprietario' OR
  (
    get_current_user_role() = 'gerente' AND
    -- Managers cannot modify valor_custo and impostos_percentual
    (valor_custo IS NULL OR valor_custo = (SELECT valor_custo FROM products WHERE id = products.id)) AND
    (impostos_percentual IS NULL OR impostos_percentual = (SELECT impostos_percentual FROM products WHERE id = products.id))
  )
);

-- Products: DELETE - Only owners and managers
CREATE POLICY "products_delete_policy" ON public.products
FOR DELETE USING (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente')
);

-- =====================================================
-- PRODUCT_VARIANTS TABLE POLICIES
-- =====================================================

-- Product Variants: SELECT - All active employees can view variants
CREATE POLICY "product_variants_select_policy" ON public.product_variants
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE user_id = auth.uid() 
      AND status = 'ativo' 
      AND deleted_at IS NULL
    )
  )
);

-- Product Variants: INSERT - Only managers and owners can create variants
CREATE POLICY "product_variants_insert_policy" ON public.product_variants
FOR INSERT WITH CHECK (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente')
);

-- Product Variants: UPDATE - Owners full access, managers restricted on impostos_percentual
CREATE POLICY "product_variants_update_policy" ON public.product_variants
FOR UPDATE USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    get_current_user_role() IN ('proprietario', 'gerente')
  )
) WITH CHECK (
  is_super_admin() OR
  get_current_user_role() = 'proprietario' OR
  (
    get_current_user_role() = 'gerente' AND
    -- Managers cannot modify impostos_percentual
    (impostos_percentual IS NULL OR impostos_percentual = (SELECT impostos_percentual FROM product_variants WHERE id = product_variants.id))
  )
);

-- Product Variants: DELETE - Only owners and managers
CREATE POLICY "product_variants_delete_policy" ON public.product_variants
FOR DELETE USING (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente')
);

-- =====================================================
-- SUPPLIERS TABLE POLICIES
-- =====================================================

-- Suppliers: SELECT - All active employees can view suppliers
CREATE POLICY "suppliers_select_policy" ON public.suppliers
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE user_id = auth.uid() 
      AND status = 'ativo' 
      AND deleted_at IS NULL
    )
  )
);

-- Suppliers: INSERT - Only managers and owners can create suppliers
CREATE POLICY "suppliers_insert_policy" ON public.suppliers
FOR INSERT WITH CHECK (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente')
);

-- Suppliers: UPDATE - Only managers and owners can update suppliers
CREATE POLICY "suppliers_update_policy" ON public.suppliers
FOR UPDATE USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    get_current_user_role() IN ('proprietario', 'gerente')
  )
) WITH CHECK (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente')
);

-- Suppliers: DELETE - Only owners and managers
CREATE POLICY "suppliers_delete_policy" ON public.suppliers
FOR DELETE USING (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente')
);

-- =====================================================
-- SALES TABLE POLICIES (Enhanced)
-- =====================================================

-- Sales: SELECT - Enhanced to respect hierarchy
CREATE POLICY "sales_select_enhanced_policy" ON public.sales
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    get_current_user_role() IN ('proprietario', 'gerente') OR
    (
      get_current_user_role() = 'vendedor' AND
      employee_id IN (
        SELECT id FROM public.employees 
        WHERE user_id = auth.uid() AND status = 'ativo'
      )
    )
  )
);

-- Sales: INSERT - Enhanced with proper employee validation
CREATE POLICY "sales_insert_enhanced_policy" ON public.sales
FOR INSERT WITH CHECK (
  is_super_admin() OR
  (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE user_id = auth.uid() 
      AND status = 'ativo' 
      AND deleted_at IS NULL
    ) AND
    employee_id IN (
      SELECT id FROM public.employees 
      WHERE user_id = auth.uid() AND status = 'ativo'
    )
  )
);

-- Sales: UPDATE - Enhanced hierarchy control
CREATE POLICY "sales_update_enhanced_policy" ON public.sales
FOR UPDATE USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    get_current_user_role() IN ('proprietario', 'gerente') OR
    (
      get_current_user_role() = 'vendedor' AND
      employee_id IN (
        SELECT id FROM public.employees 
        WHERE user_id = auth.uid() AND status = 'ativo'
      )
    )
  )
) WITH CHECK (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente') OR
  (
    get_current_user_role() = 'vendedor' AND
    employee_id IN (
      SELECT id FROM public.employees 
      WHERE user_id = auth.uid() AND status = 'ativo'
    )
  )
);

-- Sales: DELETE - Only owners and managers
CREATE POLICY "sales_delete_policy" ON public.sales
FOR DELETE USING (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente')
);

-- =====================================================
-- STOCK_MOVEMENTS TABLE POLICIES (Enhanced)
-- =====================================================

-- Stock Movements: SELECT - Enhanced hierarchy control
CREATE POLICY "stock_movements_select_enhanced_policy" ON public.stock_movements
FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    get_current_user_role() IN ('proprietario', 'gerente') OR
    (
      get_current_user_role() = 'vendedor' AND
      employee_id IN (
        SELECT id FROM public.employees 
        WHERE user_id = auth.uid() AND status = 'ativo'
      )
    )
  )
);

-- Stock Movements: INSERT - Enhanced employee validation
CREATE POLICY "stock_movements_insert_enhanced_policy" ON public.stock_movements
FOR INSERT WITH CHECK (
  is_super_admin() OR
  (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE user_id = auth.uid() 
      AND status = 'ativo' 
      AND deleted_at IS NULL
    ) AND
    employee_id IN (
      SELECT id FROM public.employees 
      WHERE user_id = auth.uid() AND status = 'ativo'
    )
  )
);

-- Stock Movements: UPDATE - Enhanced hierarchy control
CREATE POLICY "stock_movements_update_enhanced_policy" ON public.stock_movements
FOR UPDATE USING (
  deleted_at IS NULL AND (
    is_super_admin() OR
    get_current_user_role() IN ('proprietario', 'gerente') OR
    (
      get_current_user_role() = 'vendedor' AND
      employee_id IN (
        SELECT id FROM public.employees 
        WHERE user_id = auth.uid() AND status = 'ativo'
      )
    )
  )
) WITH CHECK (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente') OR
  (
    get_current_user_role() = 'vendedor' AND
    employee_id IN (
      SELECT id FROM public.employees 
      WHERE user_id = auth.uid() AND status = 'ativo'
    )
  )
);

-- Stock Movements: DELETE - Only owners and managers
CREATE POLICY "stock_movements_delete_policy" ON public.stock_movements
FOR DELETE USING (
  is_super_admin() OR
  get_current_user_role() IN ('proprietario', 'gerente')
);

-- =====================================================
-- VERIFY RLS IS ENABLED ON ALL TABLES
-- =====================================================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;