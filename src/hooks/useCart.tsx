import { useState, useCallback, useEffect } from 'react';
import { ProductVariant, Product } from '@/hooks/useProducts';

export interface CartItem {
  variant: ProductVariant & { product: Product };
  quantity: number;
  subtotal: number;
}

export interface CheckoutData {
  numeroFatura: string;
  desconto: number;
  vendedorId: string;
  total: number;
  itens: CartItem[];
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Carregar carrinho do localStorage ao inicializar
  useEffect(() => {
    const savedCart = localStorage.getItem('pdv-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('pdv-cart', JSON.stringify(items));
  }, [items]);

  // Calcular subtotal de um item
  const calculateSubtotal = useCallback((variant: ProductVariant, quantity: number) => {
    return (variant.preco_venda || 0) * quantity;
  }, []);

  // Adicionar item ao carrinho
  const addItem = useCallback((variant: ProductVariant & { product: Product }) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.variant.id === variant.id);
      
      if (existingItem) {
        // Se já existe, incrementa a quantidade
        const newQuantity = existingItem.quantity + 1;
        
        // Verificar se não excede o estoque
        const availableStock = variant.quantidade_loja + variant.quantidade_estoque;
        if (newQuantity > availableStock) {
          alert(`Estoque insuficiente. Disponível: ${availableStock}`);
          return prev;
        }
        
        return prev.map(item => 
          item.variant.id === variant.id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal: calculateSubtotal(variant, newQuantity)
              }
            : item
        );
      } else {
        // Verificar estoque antes de adicionar
        const availableStock = variant.quantidade_loja + variant.quantidade_estoque;
        if (availableStock < 1) {
          alert('Produto sem estoque disponível');
          return prev;
        }
        
        // Novo item
        const newItem: CartItem = {
          variant,
          quantity: 1,
          subtotal: calculateSubtotal(variant, 1)
        };
        return [...prev, newItem];
      }
    });
  }, [calculateSubtotal]);

  // Remover item do carrinho
  const removeItem = useCallback((variantId: string) => {
    setItems(prev => prev.filter(item => item.variant.id !== variantId));
  }, []);

  // Atualizar quantidade de um item
  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.variant.id === variantId) {
        // Verificar estoque
        const availableStock = item.variant.quantidade_loja + item.variant.quantidade_estoque;
        if (quantity > availableStock) {
          alert(`Estoque insuficiente. Disponível: ${availableStock}`);
          return item;
        }
        
        return {
          ...item,
          quantity,
          subtotal: calculateSubtotal(item.variant, quantity)
        };
      }
      return item;
    }));
  }, [calculateSubtotal, removeItem]);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Calcular total sem desconto
  const subtotalAmount = items.reduce((total, item) => total + item.subtotal, 0);

  // Calcular total com desconto
  const calculateTotal = useCallback((desconto: number = 0) => {
    const discount = Math.max(0, Math.min(100, desconto)); // Entre 0 e 100
    const discountAmount = (subtotalAmount * discount) / 100;
    return subtotalAmount - discountAmount;
  }, [subtotalAmount]);

  // Quantidade total de itens
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotalAmount,
    calculateTotal,
    itemCount,
    isEmpty: items.length === 0
  };
};