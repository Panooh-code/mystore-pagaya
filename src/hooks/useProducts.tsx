import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/hooks/useEmployee';
import { toast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  nome: string;
  contato?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
}

export interface Product {
  id: string;
  nome: string;
  modelo?: string;
  categoria: string;
  fornecedor_id?: string;
  valor_custo?: number;
  impostos_percentual?: number;
  is_consignado: boolean;
  observacoes?: string;
  created_at: string;
  created_by?: string;
  supplier?: Supplier;
  variants?: ProductVariant[];
  created_by_employee?: {
    nome_completo: string;
    email: string;
  };
}

export interface ProductVariant {
  id: string;
  product_id: string;
  referencia: string;
  cor?: string;
  tamanho?: string;
  preco_venda?: number;
  impostos_percentual?: number;
  quantidade_loja: number;
  local_loja?: string;
  quantidade_estoque: number;
  local_estoque?: string;
  foto_url_1?: string;
  foto_url_2?: string;
  foto_url_3?: string;
  foto_url_4?: string;
  created_by?: string;
}

export const useProducts = () => {
  const { user } = useAuth();
  const { employee, isAdmin } = useEmployee();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select(`
          *,
          supplier:suppliers(id, nome, contato, telefone, email, endereco, observacoes),
          variants:product_variants(*),
          created_by_employee:employees!products_created_by_fkey(nome_completo, email)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .is('deleted_at', null)
        .order('nome');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      setError(err.message);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'supplier' | 'variants' | 'created_by_employee'>) => {
    if (!isAdmin) {
      toast({ title: "Erro", description: "Sem permissão para criar produtos", variant: "destructive" });
      return null;
    }

    try {
      const productWithAudit = {
        ...productData,
        created_by: employee?.id
      };

      const { data, error } = await supabase
        .from('products')
        .insert(productWithAudit)
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Produto criado com sucesso" });
      await fetchProducts();
      return data;
    } catch (err: any) {
      console.error('Error creating product:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!isAdmin) {
      toast({ title: "Erro", description: "Sem permissão para editar produtos", variant: "destructive" });
      return false;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Produto atualizado com sucesso" });
      await fetchProducts();
      return true;
    } catch (err: any) {
      console.error('Error updating product:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!isAdmin || !employee) {
      toast({ title: "Erro", description: "Sem permissão para excluir produtos", variant: "destructive" });
      return false;
    }

    try {
      // Soft delete cascade: marcar produto e todas suas variantes como deletadas
      const { error: productError } = await supabase
        .from('products')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: employee.id 
        })
        .eq('id', id)
        .is('deleted_at', null);

      if (productError) throw productError;

      // Soft delete todas as variantes do produto
      const { error: variantsError } = await supabase
        .from('product_variants')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: employee.id 
        })
        .eq('product_id', id)
        .is('deleted_at', null);

      if (variantsError) throw variantsError;
      
      toast({ title: "Sucesso", description: "Produto excluído com sucesso" });
      await fetchProducts();
      return true;
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const createSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    if (!isAdmin) {
      toast({ title: "Erro", description: "Sem permissão para criar fornecedores", variant: "destructive" });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Fornecedor criado com sucesso" });
      await fetchSuppliers();
      return data;
    } catch (err: any) {
      console.error('Error creating supplier:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchSuppliers();
    }
  }, [user]);

  return {
    products,
    suppliers,
    loading,
    error,
    fetchProducts,
    fetchSuppliers,
    createProduct,
    updateProduct,
    deleteProduct,
    createSupplier,
    isAdmin,
    employee
  };
};