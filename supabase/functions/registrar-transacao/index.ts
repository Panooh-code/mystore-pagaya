import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransacaoItem {
  variant_id: string;
  quantidade: number;
  preco_unitario: number;
}

interface TransacaoPayload {
  fatura_numero: string;
  desconto_percentual: number;
  employee_id: string;
  tipo_transacao: 'VENDA' | 'DEVOLUCAO' | 'TROCA';
  itens: TransacaoItem[];
  original_sale_id?: string;
  destino_devolucao?: 'LOJA' | 'FORNECEDOR';
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Received request:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: TransacaoPayload = await req.json();
    
    console.log('Transacao payload:', payload);

    // Validar payload
    if (!payload.fatura_numero || !payload.employee_id || !payload.itens || payload.itens.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Dados obrigatórios não fornecidos' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar se funcionário existe e está ativo
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, role, status')
      .eq('id', payload.employee_id)
      .eq('status', 'ativo')
      .single();

    if (empError || !employee) {
      console.error('Employee validation error:', empError);
      return new Response(JSON.stringify({ 
        error: 'Funcionário não encontrado ou inativo' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (payload.tipo_transacao === 'VENDA') {
      return await processarVenda(supabase, payload);
    } else {
      return await processarDevolucao(supabase, payload);
    }

  } catch (error: any) {
    console.error("Error in registrar-transacao function:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString() 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function processarVenda(supabase: any, payload: TransacaoPayload): Promise<Response> {
  console.log('Processing sale...');
  
  try {
    // Verificar se número da fatura já existe
    const { data: existingSale } = await supabase
      .from('sales')
      .select('id')
      .eq('fatura_numero', payload.fatura_numero)
      .single();

    if (existingSale) {
      return new Response(JSON.stringify({ 
        error: 'Número da fatura já existe' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar estoque para todos os itens
    for (const item of payload.itens) {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('quantidade_loja, quantidade_estoque')
        .eq('id', item.variant_id)
        .single();

      if (variantError || !variant) {
        return new Response(JSON.stringify({ 
          error: `Produto não encontrado: ${item.variant_id}` 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const estoqueTotal = (variant.quantidade_loja || 0) + (variant.quantidade_estoque || 0);
      if (estoqueTotal < item.quantidade) {
        return new Response(JSON.stringify({ 
          error: `Estoque insuficiente. Disponível: ${estoqueTotal}, Solicitado: ${item.quantidade}` 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Calcular total da venda
    const subtotal = payload.itens.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);
    const desconto = (subtotal * payload.desconto_percentual) / 100;
    const total = subtotal - desconto;

    // Criar venda
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        fatura_numero: payload.fatura_numero,
        employee_id: payload.employee_id,
        tipo_transacao: 'VENDA',
        desconto_percentual: payload.desconto_percentual,
        total_venda: total
      })
      .select()
      .single();

    if (saleError) {
      console.error('Sale creation error:', saleError);
      throw saleError;
    }

    console.log('Sale created:', sale.id);

    // Processar cada item
    for (const item of payload.itens) {
      // Buscar variante atual
      const { data: variant } = await supabase
        .from('product_variants')
        .select('quantidade_loja, quantidade_estoque')
        .eq('id', item.variant_id)
        .single();

      // Decrementar estoque (prioridade: loja primeiro, depois estoque)
      let novaQuantidadeLoja = variant.quantidade_loja || 0;
      let novaQuantidadeEstoque = variant.quantidade_estoque || 0;
      let quantidadeRestante = item.quantidade;

      if (novaQuantidadeLoja >= quantidadeRestante) {
        novaQuantidadeLoja -= quantidadeRestante;
      } else {
        quantidadeRestante -= novaQuantidadeLoja;
        novaQuantidadeLoja = 0;
        novaQuantidadeEstoque -= quantidadeRestante;
      }

      // Atualizar estoque
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({
          quantidade_loja: novaQuantidadeLoja,
          quantidade_estoque: novaQuantidadeEstoque
        })
        .eq('id', item.variant_id);

      if (updateError) {
        console.error('Stock update error:', updateError);
        throw updateError;
      }

      // Criar movimento de estoque
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          variant_id: item.variant_id,
          employee_id: payload.employee_id,
          sale_id: sale.id,
          tipo_movimento: 'VENDA',
          quantidade: item.quantidade,
          tipo: 'saida',
          observacoes: `Venda - Fatura: ${payload.fatura_numero}`
        });

      if (movementError) {
        console.error('Stock movement error:', movementError);
        throw movementError;
      }
    }

    console.log('Sale processed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      sale_id: sale.id,
      message: 'Venda registrada com sucesso'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error processing sale:', error);
    throw error;
  }
}

async function processarDevolucao(supabase: any, payload: TransacaoPayload): Promise<Response> {
  console.log('Processing return/exchange...');
  
  try {
    if (!payload.original_sale_id) {
      return new Response(JSON.stringify({ 
        error: 'ID da venda original é obrigatório para devoluções' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar se venda original existe
    const { data: originalSale, error: originalSaleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', payload.original_sale_id)
      .single();

    if (originalSaleError || !originalSale) {
      return new Response(JSON.stringify({ 
        error: 'Venda original não encontrada' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Calcular total da devolução (negativo para crédito)
    const subtotal = payload.itens.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);
    const desconto = (subtotal * payload.desconto_percentual) / 100;
    const total = -(subtotal - desconto); // Negativo para devolução

    // Criar registro de devolução
    const { data: returnSale, error: returnError } = await supabase
      .from('sales')
      .insert({
        fatura_numero: payload.fatura_numero,
        employee_id: payload.employee_id,
        tipo_transacao: payload.tipo_transacao,
        desconto_percentual: payload.desconto_percentual,
        total_venda: total
      })
      .select()
      .single();

    if (returnError) {
      console.error('Return creation error:', returnError);
      throw returnError;
    }

    // Processar cada item devolvido
    for (const item of payload.itens) {
      // Buscar variante atual
      const { data: variant } = await supabase
        .from('product_variants')
        .select('quantidade_loja, quantidade_estoque')
        .eq('id', item.variant_id)
        .single();

      // Incrementar estoque baseado no destino
      let novaQuantidadeLoja = variant.quantidade_loja || 0;
      let novaQuantidadeEstoque = variant.quantidade_estoque || 0;

      if (payload.destino_devolucao === 'LOJA' || !payload.destino_devolucao) {
        novaQuantidadeLoja += item.quantidade;
      } else {
        novaQuantidadeEstoque += item.quantidade;
      }

      // Atualizar estoque
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({
          quantidade_loja: novaQuantidadeLoja,
          quantidade_estoque: novaQuantidadeEstoque
        })
        .eq('id', item.variant_id);

      if (updateError) {
        console.error('Stock update error:', updateError);
        throw updateError;
      }

      // Determinar tipo de movimento
      let tipoMovimento = 'DEVOLUCAO';
      if (payload.destino_devolucao === 'FORNECEDOR') {
        tipoMovimento = 'DEVOLUCAO_FORNECEDOR';
      } else if (payload.tipo_transacao === 'TROCA') {
        tipoMovimento = 'TROCA';
      }

      // Criar movimento de estoque
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          variant_id: item.variant_id,
          employee_id: payload.employee_id,
          sale_id: returnSale.id,
          tipo_movimento: tipoMovimento,
          quantidade: item.quantidade,
          tipo: 'entrada',
          observacoes: `${payload.tipo_transacao} - Fatura: ${payload.fatura_numero} - Original: ${originalSale.fatura_numero}`
        });

      if (movementError) {
        console.error('Stock movement error:', movementError);
        throw movementError;
      }
    }

    console.log('Return/Exchange processed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      sale_id: returnSale.id,
      message: `${payload.tipo_transacao === 'TROCA' ? 'Troca' : 'Devolução'} registrada com sucesso`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error processing return/exchange:', error);
    throw error;
  }
}

serve(handler);