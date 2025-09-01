import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from '@/hooks/useEmployee';
import { toast } from '@/hooks/use-toast';

export interface StockMovement {
  id: string;
  variant_id: string;
  employee_id: string;
  tipo: 'entrada' | 'saida' | 'transferencia' | 'perda' | 'venda';
  quantidade: number;
  origem?: string;
  destino?: string;
  observacoes?: string;
  created_at: string;
  variant?: any;
}

export const useStockMovements = () => {
  const { user } = useAuth();
  const { employee, isAdmin } = useEmployee();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          variant:product_variants(
            id,
            referencia,
            cor,
            tamanho,
            product:products(nome)
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMovements((data || []) as StockMovement[]);
    } catch (err: any) {
      console.error('Error fetching stock movements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createMovement = async (movementData: {
    variant_id: string;
    tipo: 'entrada' | 'saida' | 'transferencia' | 'perda' | 'venda';
    quantidade: number;
    origem?: string;
    destino?: string;
    observacoes?: string;
  }) => {
    if (!isAdmin || !employee) {
      toast({ title: "Erro", description: "Sem permissão para criar movimentações", variant: "destructive" });
      return false;
    }

    try {
      // Start a transaction to update both stock and create movement
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('quantidade_loja, quantidade_estoque')
        .eq('id', movementData.variant_id)
        .is('deleted_at', null)
        .single();

      if (variantError) throw variantError;

      let updates: any = {};
      
      // Calculate new quantities based on movement type
      if (movementData.tipo === 'entrada') {
        if (movementData.destino === 'loja') {
          updates.quantidade_loja = variant.quantidade_loja + movementData.quantidade;
        } else if (movementData.destino === 'estoque') {
          updates.quantidade_estoque = variant.quantidade_estoque + movementData.quantidade;
        }
      } else if (movementData.tipo === 'saida' || movementData.tipo === 'perda' || movementData.tipo === 'venda') {
        if (movementData.origem === 'loja') {
          updates.quantidade_loja = variant.quantidade_loja - movementData.quantidade;
        } else if (movementData.origem === 'estoque') {
          updates.quantidade_estoque = variant.quantidade_estoque - movementData.quantidade;
        }
      } else if (movementData.tipo === 'transferencia') {
        if (movementData.origem === 'loja' && movementData.destino === 'estoque') {
          updates.quantidade_loja = variant.quantidade_loja - movementData.quantidade;
          updates.quantidade_estoque = variant.quantidade_estoque + movementData.quantidade;
        } else if (movementData.origem === 'estoque' && movementData.destino === 'loja') {
          updates.quantidade_estoque = variant.quantidade_estoque - movementData.quantidade;
          updates.quantidade_loja = variant.quantidade_loja + movementData.quantidade;
        }
      }

      // Check for negative stock
      if (updates.quantidade_loja < 0 || updates.quantidade_estoque < 0) {
        toast({ title: "Erro", description: "Estoque insuficiente para esta operação", variant: "destructive" });
        return false;
      }

      // Update variant quantities
      const { error: updateError } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', movementData.variant_id);

      if (updateError) throw updateError;

      // Create movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          variant_id: movementData.variant_id,
          employee_id: employee.id,
          tipo: movementData.tipo,
          tipo_movimento: movementData.tipo.toUpperCase() as any,
          quantidade: movementData.quantidade,
          origem: movementData.origem,
          destino: movementData.destino,
          observacoes: movementData.observacoes
        });

      if (movementError) throw movementError;

      toast({ title: "Sucesso", description: "Movimentação registrada com sucesso" });
      await fetchMovements();
      return true;
    } catch (err: any) {
      console.error('Error creating movement:', err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchMovements();
    }
  }, [user]);

  return {
    movements,
    loading,
    error,
    fetchMovements,
    createMovement,
    isAdmin
  };
};