import React, { useState } from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from '@/hooks/useCart';
import { useSales } from '@/hooks/useSales';
import { useEmployee } from '@/hooks/useEmployee';
import { ProductSearch } from '@/components/pdv/ProductSearch';
import { CartItem } from '@/components/pdv/CartItem';
import { CheckoutForm } from '@/components/pdv/CheckoutForm';
import { DevolucaoModal } from '@/components/pdv/DevolucaoModal';

export default function PDV() {
  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotalAmount,
    calculateTotal,
    itemCount,
    isEmpty
  } = useCart();

  const { registrarTransacao, convertCartItemsToTransacaoItems, loading: salesLoading } = useSales();
  const { employee } = useEmployee();

  // Estados do formulário de checkout
  const [numeroFatura, setNumeroFatura] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [vendedorId, setVendedorId] = useState('');
  const [devolucaoModalOpen, setDevolucaoModalOpen] = useState(false);

  // Calcular total com desconto
  const total = calculateTotal(desconto);

  // Função para registrar venda
  const handleRegistrarVenda = async () => {
    if (!numeroFatura.trim() || !vendedorId || isEmpty) {
      return;
    }

    const payload = {
      fatura_numero: numeroFatura.trim(),
      desconto_percentual: desconto,
      employee_id: vendedorId,
      tipo_transacao: 'VENDA' as const,
      itens: convertCartItemsToTransacaoItems(items)
    };

    const { error } = await registrarTransacao(payload);
    if (!error) {
      clearCart();
      setNumeroFatura('');
      setDesconto(0);
      setVendedorId('');
    }
  };

  // Função para abrir modal de devolução
  const handleRegistrarDevolucao = () => {
    setDevolucaoModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Package className="h-6 w-6" />
            PDV - Ponto de Venda
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Layout Principal */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Busca e Carrinho */}
        <div className="space-y-6">
          {/* Busca de Produtos */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSearch onAddToCart={addItem} />
            </CardContent>
          </Card>

          {/* Carrinho */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Carrinho
                </span>
                {itemCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-sm px-2 py-1 rounded-full">
                    {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEmpty ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Carrinho vazio</p>
                  <p className="text-sm">Use a busca acima para adicionar produtos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <CartItem
                      key={item.variant.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Checkout */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          <CheckoutForm
            subtotalAmount={subtotalAmount}
            desconto={desconto}
            onDescontoChange={setDesconto}
            numeroFatura={numeroFatura}
            onNumeroFaturaChange={setNumeroFatura}
            vendedorId={vendedorId}
            onVendedorChange={setVendedorId}
            total={total}
            onRegistrarVenda={handleRegistrarVenda}
            onRegistrarDevolucao={handleRegistrarDevolucao}
            isEmpty={isEmpty}
            loading={salesLoading}
          />
        </div>
      </div>

      {/* Modal de Devolução/Troca */}
      <DevolucaoModal
        open={devolucaoModalOpen}
        onClose={() => setDevolucaoModalOpen(false)}
        onSuccess={() => {
          console.log('Devolução/Troca processada com sucesso');
        }}
      />
    </div>
  );
}