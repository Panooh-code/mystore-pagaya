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
      // Chama a função PostgreSQL segura e transacional
      const { data, error } = await supabase.rpc('registrar_movimentacao_estoque', {
        p_variant_id: movementData.variant_id,
        p_employee_id: employee.id,
        p_tipo: movementData.tipo,
        p_quantidade: movementData.quantidade,
        p_origem: movementData.origem,
        p_destino: movementData.destino,
        p_observacoes: movementData.observacoes
      });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Movimentação registrada com sucesso" });
      await fetchMovements();
      return true;
    } catch (err: any) {
      console.error('Error creating movement:', err);
      const errorMessage = err.message || 'Erro ao registrar movimentação';
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
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