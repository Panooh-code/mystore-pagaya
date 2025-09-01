import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CartItem } from './useCart';

export interface TransacaoItem {
  variant_id: string;
  quantidade: number;
  preco_unitario: number;
}

export interface TransacaoPayload {
  fatura_numero: string;
  desconto_percentual: number;
  employee_id: string;
  tipo_transacao: 'VENDA' | 'DEVOLUCAO' | 'TROCA';
  itens: TransacaoItem[];
  original_sale_id?: string;
  destino_devolucao?: 'LOJA' | 'FORNECEDOR';
}

export interface VendaItem {
  id: string;
  variant_id: string;
  quantidade: number;
  preco_unitario: number;
  variant: {
    referencia: string;
    cor?: string;
    tamanho?: string;
    foto_url_1?: string;
    product: {
      nome: string;
      categoria: string;
    };
  };
}

export interface VendaCompleta {
  id: string;
  fatura_numero: string;
  employee_id: string;
  tipo_transacao: string;
  desconto_percentual: number;
  total_venda: number;
  created_at: string;
  employee: {
    nome_completo: string;
  };
  itens: VendaItem[];
}

export const useSales = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const registrarTransacao = async (payload: TransacaoPayload) => {
    setLoading(true);
    console.log('Registering transaction:', payload);

    try {
      const { data, error } = await supabase.functions.invoke('registrar-transacao', {
        body: payload
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Business logic error:', data.error);
        throw new Error(data.error);
      }

      console.log('Transaction registered successfully:', data);
      
      toast({
        title: "Sucesso!",
        description: data.message || "Transação registrada com sucesso",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error registering transaction:', error);
      
      toast({
        title: "Erro ao registrar transação",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });

      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const buscarVendaPorFatura = async (faturaNumero: string): Promise<VendaCompleta | null> => {
    setLoading(true);
    console.log('Searching sale by invoice:', faturaNumero);

    try {
      // Buscar venda
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
          id,
          fatura_numero,
          employee_id,
          tipo_transacao,
          desconto_percentual,
          total_venda,
          created_at,
          employee:employees(nome_completo)
        `)
        .eq('fatura_numero', faturaNumero)
        .eq('tipo_transacao', 'VENDA')
        .single();

      if (saleError || !sale) {
        toast({
          title: "Venda não encontrada",
          description: `Não foi encontrada uma venda com a fatura: ${faturaNumero}`,
          variant: "destructive",
        });
        return null;
      }

      // Buscar itens da venda através dos stock movements
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('id, variant_id, quantidade')
        .eq('sale_id', sale.id)
        .eq('tipo_movimento', 'VENDA');

      if (movementsError) {
        console.error('Error fetching sale items:', movementsError);
        throw movementsError;
      }

      // Buscar dados das variantes para cada movimento
      const itens: VendaItem[] = [];
      for (const movement of movements || []) {
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .select(`
            referencia,
            cor,
            tamanho,
            foto_url_1,
            preco_venda,
            product:products(nome, categoria)
          `)
          .eq('id', movement.variant_id)
          .single();

        if (!variantError && variant) {
          itens.push({
            id: movement.id,
            variant_id: movement.variant_id,
            quantidade: movement.quantidade,
            preco_unitario: variant.preco_venda || 0,
            variant: {
              referencia: variant.referencia || '',
              cor: variant.cor,
              tamanho: variant.tamanho,
              foto_url_1: variant.foto_url_1,
              product: {
                nome: variant.product?.nome || '',
                categoria: variant.product?.categoria || ''
              }
            }
          });
        }
      }

      const vendaCompleta: VendaCompleta = {
        ...sale,
        employee: Array.isArray(sale.employee) ? sale.employee[0] : sale.employee,
        itens
      };

      console.log('Sale found:', vendaCompleta);
      return vendaCompleta;

    } catch (error: any) {
      console.error('Error searching sale:', error);
      
      toast({
        title: "Erro ao buscar venda",
        description: "Ocorreu um erro ao buscar a venda. Tente novamente.",
        variant: "destructive",
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  const convertCartItemsToTransacaoItems = (cartItems: CartItem[]): TransacaoItem[] => {
    return cartItems.map(item => ({
      variant_id: item.variant.id,
      quantidade: item.quantity,
      preco_unitario: item.variant.preco_venda || 0
    }));
  };

  return {
    loading,
    registrarTransacao,
    buscarVendaPorFatura,
    convertCartItemsToTransacaoItems
  };
};