import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem as CartItemType } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove
}) => {
  const { variant, quantity, subtotal } = item;
  const availableStock = variant.quantidade_loja + variant.quantidade_estoque;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getDisplayName = () => {
    const parts = [variant.product.nome];
    if (variant.cor) parts.push(`Cor: ${variant.cor}`);
    if (variant.tamanho) parts.push(`Tam: ${variant.tamanho}`);
    return parts.join(' • ');
  };

  const getImageSrc = () => {
    return variant.foto_url_1 || '/placeholder.svg';
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex gap-3">
        {/* Imagem do produto */}
        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={getImageSrc()}
            alt={variant.product.nome}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>

        {/* Informações do produto */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="font-medium text-sm leading-tight line-clamp-2">
                {getDisplayName()}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Ref: {variant.referencia}
              </p>
              <p className="text-xs text-muted-foreground">
                Estoque: {availableStock}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(variant.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Controles de quantidade e preço */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(variant.id, quantity - 1)}
            className="h-8 w-8 p-0"
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <span className="w-12 text-center font-medium">
            {quantity}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateQuantity(variant.id, quantity + 1)}
            className="h-8 w-8 p-0"
            disabled={quantity >= availableStock}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {formatPrice(variant.preco_venda || 0)} × {quantity}
          </p>
          <p className="font-semibold">
            {formatPrice(subtotal)}
          </p>
        </div>
      </div>
    </div>
  );
};