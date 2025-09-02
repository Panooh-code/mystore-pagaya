import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/hooks/useEmployee';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from '@/hooks/use-toast';

// As interfaces foram mantidas para compatibilidade com o resto do sistema.
// A lógica de edição agora foca no produto principal.
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
  // Novos campos para alinhamento com o novo modal de edição
  sku?: string;
  price?: number;
  promotional_price?: number;
  cost_price?: number;
  tax_on_cost?: number;
  image_urls?: string[];
  // Relações existentes
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
  const { uploadMultipleImages, deleteMultipleImages } = useImageUpload(); // Hook de upload de imagens
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    // A condição de guarda previne a execução se não houver usuário
    if (!user?.id) return;

    try {
      setLoading(true);
      const query = supabase
        .from('products')
        .select(`
          *,
          supplier:suppliers(id, nome, contato, telefone, email, endereco, observacoes),
          variants:product_variants(*),
          created_by_employee:employees!products_created_by_fkey(nome_completo, email)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // A dependência agora é user?.id, que é um valor primitivo e estável.
  }, [user?.id]);

  const fetchSuppliers = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('suppliers')
        .select('*')
        .is('deleted_at', null)
        .order('nome');

      if (fetchError) throw fetchError;
      setSuppliers(data || []);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      setError(err.message);
    }
    // A dependência aqui também foi trocada para user?.id.
  }, [user?.id]);

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

      const { data, error: insertError } = await supabase
        .from('products')
        .insert(productWithAudit)
        .select()
        .single();

      if (insertError) throw insertError;

      toast({ title: "Sucesso", description: "Produto criado com sucesso" });
      await fetchProducts();
      return data;
    } catch (err: any) {
      console.error('Error creating product:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const updateProduct = async (
    productId: string,
    productUpdates: Partial<Product>,
    newImageFiles: File[],
    imagesToRemove: string[]
  ) => {
    if (!isAdmin) {
      toast({ title: "Erro", description: "Sem permissão para editar produtos", variant: "destructive" });
      return false;
    }

    try {
      if (imagesToRemove.length > 0) {
        await deleteMultipleImages(imagesToRemove, 'product_images');
      }

      let newImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const uploadedUrls = await uploadMultipleImages(newImageFiles, 'product_images');
        if (uploadedUrls) {
          newImageUrls = uploadedUrls;
        }
      }

      const currentProduct = products.find(p => p.id === productId);
      const existingImageUrls = currentProduct?.image_urls?.filter(url => !imagesToRemove.includes(url)) || [];
      const finalImageUrls = [...existingImageUrls, ...newImageUrls];

      const updatesWithImages = {
        ...productUpdates,
        image_urls: finalImageUrls,
      };

      const { error: updateError } = await supabase
        .from('products')
        .update(updatesWithImages)
        .eq('id', productId);

      if (updateError) throw updateError;

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
      const { error: productError } = await supabase
        .from('products')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: employee.id
        })
        .eq('id', id)
        .is('deleted_at', null);

      if (productError) throw productError;

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
      const { data, error: insertError } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();

      if (insertError) throw insertError;

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
    // Este useEffect agora depende das funções estabilizadas e não causará mais loops.
    if (user) {
      fetchProducts();
      fetchSuppliers();
    }
  }, [user, fetchProducts, fetchSuppliers]);

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
