import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/hooks/useEmployee';
import { toast } from '@/hooks/use-toast';
import { ProductVariant } from './useProducts';

export const useProductVariants = (productId?: string) => {
  const { user } = useAuth();
  const { isAdmin } = useEmployee();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVariants = async (pId?: string) => {
    const targetProductId = pId || productId;
    if (!user || !targetProductId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', targetProductId)
        .order('referencia');

      if (error) throw error;
      setVariants(data || []);
    } catch (err: any) {
      console.error('Error fetching variants:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createVariant = async (variantData: Omit<ProductVariant, 'id'>) => {
    if (!isAdmin) {
      toast({ title: "Erro", description: "Sem permissão para criar variantes", variant: "destructive" });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert(variantData)
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Variante criada com sucesso" });
      await fetchVariants();
      return data;
    } catch (err: any) {
      console.error('Error creating variant:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const createMultipleVariants = async (variants: Omit<ProductVariant, 'id'>[]) => {
    if (!isAdmin) {
      toast({ title: "Erro", description: "Sem permissão para criar variantes", variant: "destructive" });
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert(variants)
        .select();

      if (error) throw error;
      
      toast({ title: "Sucesso", description: `${variants.length} variantes criadas com sucesso` });
      await fetchVariants();
      return data || [];
    } catch (err: any) {
      console.error('Error creating variants:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return [];
    }
  };

  const updateVariant = async (id: string, updates: Partial<ProductVariant>) => {
    if (!isAdmin) {
      toast({ title: "Erro", description: "Sem permissão para editar variantes", variant: "destructive" });
      return false;
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Variante atualizada com sucesso" });
      await fetchVariants();
      return true;
    } catch (err: any) {
      console.error('Error updating variant:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteVariant = async (id: string) => {
    if (!isAdmin) {
      toast({ title: "Erro", description: "Sem permissão para excluir variantes", variant: "destructive" });
      return false;
    }

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Variante excluída com sucesso" });
      await fetchVariants();
      return true;
    } catch (err: any) {
      console.error('Error deleting variant:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    if (productId) {
      fetchVariants(productId);
    }
  }, [productId, user]);

  return {
    variants,
    loading,
    error,
    fetchVariants,
    createVariant,
    createMultipleVariants,
    updateVariant,
    deleteVariant,
    isAdmin
  };
};