import React, { useState } from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from '@/hooks/useCart';
import { ProductSearch } from '@/components/pdv/ProductSearch';
import { CartItem } from '@/components/pdv/CartItem';
import { CheckoutForm } from '@/components/pdv/CheckoutForm';

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

  // Estados do formulário de checkout
  const [numeroFatura, setNumeroFatura] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [vendedorId, setVendedorId] = useState('');

  // Calcular total com desconto
  const total = calculateTotal(desconto);

  // Função para registrar venda (temporário - console.log)
  const handleRegistrarVenda = () => {
    const checkoutData = {
      numeroFatura,
      desconto,
      vendedorId,
      total,
      itens: items,
      tipo: 'VENDA'
    };
    
    console.log('🛍️ Dados da Venda:', checkoutData);
    console.log('📋 Resumo:', {
      totalItens: itemCount,
      subtotal: subtotalAmount,
      descontoAplicado: desconto,
      valorDesconto: (subtotalAmount * desconto) / 100,
      valorFinal: total
    });
  };

  // Função para registrar devolução (temporário - console.log)
  const handleRegistrarDevolucao = () => {
    const checkoutData = {
      numeroFatura,
      desconto,
      vendedorId,
      total,
      itens: items,
      tipo: 'DEVOLUCAO'
    };
    
    console.log('🔄 Dados da Devolução/Troca:', checkoutData);
    console.log('📋 Resumo:', {
      totalItens: itemCount,
      subtotal: subtotalAmount,
      descontoAplicado: desconto,
      valorDesconto: (subtotalAmount * desconto) / 100,
      valorFinal: total
    });
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
          />
        </div>
      </div>
    </div>
  );
}