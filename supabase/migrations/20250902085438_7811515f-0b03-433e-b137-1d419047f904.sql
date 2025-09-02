-- Função para registrar movimentações de estoque de forma segura e transacional
CREATE OR REPLACE FUNCTION public.registrar_movimentacao_estoque(
    p_variant_id UUID,
    p_employee_id UUID,
    p_tipo TEXT,
    p_quantidade INTEGER,
    p_origem TEXT DEFAULT NULL,
    p_destino TEXT DEFAULT NULL,
    p_observacoes TEXT DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_variant RECORD;
    v_nova_quantidade_loja INTEGER;
    v_nova_quantidade_estoque INTEGER;
    v_movimento_id UUID;
BEGIN
    -- Bloqueia a linha para evitar condições de corrida
    SELECT quantidade_loja, quantidade_estoque, id
    INTO v_variant
    FROM public.product_variants 
    WHERE id = p_variant_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variante do produto não encontrada ou foi deletada';
    END IF;

    -- Inicializa as novas quantidades com os valores atuais
    v_nova_quantidade_loja := v_variant.quantidade_loja;
    v_nova_quantidade_estoque := v_variant.quantidade_estoque;

    -- Calcula as novas quantidades baseado no tipo de movimento
    CASE p_tipo
        WHEN 'entrada' THEN
            IF p_destino = 'loja' THEN
                v_nova_quantidade_loja := v_variant.quantidade_loja + p_quantidade;
            ELSIF p_destino = 'estoque' THEN
                v_nova_quantidade_estoque := v_variant.quantidade_estoque + p_quantidade;
            ELSE
                RAISE EXCEPTION 'Para entrada, deve especificar destino como "loja" ou "estoque"';
            END IF;
        
        WHEN 'saida', 'perda', 'venda' THEN
            IF p_origem = 'loja' THEN
                IF v_variant.quantidade_loja < p_quantidade THEN
                    RAISE EXCEPTION 'Estoque insuficiente na loja. Disponível: %, Solicitado: %', v_variant.quantidade_loja, p_quantidade;
                END IF;
                v_nova_quantidade_loja := v_variant.quantidade_loja - p_quantidade;
            ELSIF p_origem = 'estoque' THEN
                IF v_variant.quantidade_estoque < p_quantidade THEN
                    RAISE EXCEPTION 'Estoque insuficiente no estoque. Disponível: %, Solicitado: %', v_variant.quantidade_estoque, p_quantidade;
                END IF;
                v_nova_quantidade_estoque := v_variant.quantidade_estoque - p_quantidade;
            ELSE
                RAISE EXCEPTION 'Para saída, deve especificar origem como "loja" ou "estoque"';
            END IF;
        
        WHEN 'transferencia' THEN
            IF p_origem = 'loja' AND p_destino = 'estoque' THEN
                IF v_variant.quantidade_loja < p_quantidade THEN
                    RAISE EXCEPTION 'Estoque insuficiente na loja para transferência. Disponível: %, Solicitado: %', v_variant.quantidade_loja, p_quantidade;
                END IF;
                v_nova_quantidade_loja := v_variant.quantidade_loja - p_quantidade;
                v_nova_quantidade_estoque := v_variant.quantidade_estoque + p_quantidade;
            ELSIF p_origem = 'estoque' AND p_destino = 'loja' THEN
                IF v_variant.quantidade_estoque < p_quantidade THEN
                    RAISE EXCEPTION 'Estoque insuficiente no estoque para transferência. Disponível: %, Solicitado: %', v_variant.quantidade_estoque, p_quantidade;
                END IF;
                v_nova_quantidade_estoque := v_variant.quantidade_estoque - p_quantidade;
                v_nova_quantidade_loja := v_variant.quantidade_loja + p_quantidade;
            ELSE
                RAISE EXCEPTION 'Para transferência, deve especificar origem e destino válidos ("loja" ou "estoque")';
            END IF;
        
        ELSE
            RAISE EXCEPTION 'Tipo de movimento inválido: %', p_tipo;
    END CASE;

    -- Atualiza as quantidades na tabela de variantes
    UPDATE public.product_variants
    SET 
        quantidade_loja = v_nova_quantidade_loja,
        quantidade_estoque = v_nova_quantidade_estoque,
        updated_at = now()
    WHERE id = p_variant_id;

    -- Insere o registro da movimentação
    INSERT INTO public.stock_movements (
        variant_id,
        employee_id,
        tipo,
        tipo_movimento,
        quantidade,
        origem,
        destino,
        observacoes
    ) VALUES (
        p_variant_id,
        p_employee_id,
        p_tipo,
        p_tipo::stock_movement_type,
        p_quantidade,
        p_origem,
        p_destino,
        p_observacoes
    ) RETURNING id INTO v_movimento_id;

    -- Retorna informações sobre a operação
    RETURN jsonb_build_object(
        'success', true,
        'movement_id', v_movimento_id,
        'nova_quantidade_loja', v_nova_quantidade_loja,
        'nova_quantidade_estoque', v_nova_quantidade_estoque,
        'message', 'Movimentação registrada com sucesso'
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro para auditoria
        RAISE EXCEPTION 'Erro ao registrar movimentação de estoque: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concede permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.registrar_movimentacao_estoque(UUID, UUID, TEXT, INTEGER, TEXT, TEXT, TEXT) TO authenticated;