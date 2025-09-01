import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from './useEmployee';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  nome: string;
  contato?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export const useSuppliers = () => {
  const { user } = useAuth();
  const { employee } = useEmployee();
  const { toast } = useToast();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = employee?.role === 'proprietario' || employee?.role === 'gerente';

  const fetchSuppliers = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
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
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by'>) => {
    if (!isAdmin) {
      throw new Error('Apenas proprietários e gerentes podem criar fornecedores');
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso!"
      });

      await fetchSuppliers();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating supplier:', err);
      toast({
        title: "Erro",
        description: err.message || "Erro ao criar fornecedor",
        variant: "destructive"
      });
      return { data: null, error: err };
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!isAdmin) {
      throw new Error('Apenas proprietários e gerentes podem editar fornecedores');
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso!"
      });

      await fetchSuppliers();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating supplier:', err);
      toast({
        title: "Erro",
        description: err.message || "Erro ao atualizar fornecedor",
        variant: "destructive"
      });
      return { data: null, error: err };
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas proprietários e gerentes podem excluir fornecedores');
    }

    try {
      // Verificar se existem produtos vinculados
      const { data: linkedProducts, error: checkError } = await supabase
        .from('products')
        .select('id, nome')
        .eq('fornecedor_id', id)
        .is('deleted_at', null);

      if (checkError) throw checkError;

      if (linkedProducts && linkedProducts.length > 0) {
        throw new Error(`Não é possível excluir este fornecedor pois existem ${linkedProducts.length} produto(s) vinculado(s)`);
      }

      // Soft delete
      const { error } = await supabase.rpc('soft_delete', {
        table_name: 'suppliers',
        record_id: id,
        deleted_by_user: user?.id
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso!"
      });

      await fetchSuppliers();
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting supplier:', err);
      toast({
        title: "Erro",
        description: err.message || "Erro ao excluir fornecedor",
        variant: "destructive"
      });
      return { error: err };
    }
  };

  useEffect(() => {
    if (user && employee?.status === 'ativo') {
      fetchSuppliers();
    }
  }, [user, employee?.status]);

  return {
    suppliers,
    loading,
    error,
    isAdmin,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  };
};