import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProducts, ProductVariant, Product } from '@/hooks/useProducts';

interface ProductSearchProps {
  onAddToCart: (variant: ProductVariant & { product: Product }) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ onAddToCart }) => {
  const { products, loading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Flatten all variants with their product info
  const allVariants = useMemo(() => {
    const variants: (ProductVariant & { product: Product })[] = [];
    
    products.forEach(product => {
      if (product.variants) {
        product.variants.forEach(variant => {
          variants.push({
            ...variant,
            product: product
          });
        });
      }
    });
    
    return variants;
  }, [products]);

  // Filter variants based on search query
  const filteredVariants = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    
    return allVariants.filter(variant => {
      const searchableFields = [
        variant.product.nome,
        variant.product.categoria,
        variant.referencia,
        variant.cor,
        variant.tamanho,
        variant.product.modelo
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableFields.includes(query);
    });
  }, [allVariants, searchQuery]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getDisplayName = (variant: ProductVariant & { product: Product }) => {
    const parts = [variant.product.nome];
    if (variant.cor) parts.push(`Cor: ${variant.cor}`);
    if (variant.tamanho) parts.push(`Tam: ${variant.tamanho}`);
    return parts.join(' • ');
  };

  const getImageSrc = (variant: ProductVariant) => {
    return variant.foto_url_1 || '/placeholder.svg';
  };

  const getAvailableStock = (variant: ProductVariant) => {
    return variant.quantidade_loja + variant.quantidade_estoque;
  };

  const handleAddToCart = (variant: ProductVariant & { product: Product }) => {
    onAddToCart(variant);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Buscar produtos por nome, categoria, cor, tamanho..."
          className="pl-9 glass-card border-0"
        />
      </div>

      {/* Search Results */}
      {showResults && searchQuery.trim() && (
        <Card className="absolute top-full left-0 right-0 z-10 mt-1 glass-card border-0 max-h-80 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Carregando produtos...
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhum produto encontrado
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {filteredVariants.slice(0, 10).map((variant) => {
                  const stock = getAvailableStock(variant);
                  const hasStock = stock > 0;
                  
                  return (
                    <div
                      key={variant.id}
                      className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Imagem */}
                        <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={getImageSrc(variant)}
                            alt={variant.product.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight line-clamp-1">
                            {getDisplayName(variant)}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Ref: {variant.referencia} • Estoque: {stock}
                          </p>
                          {variant.preco_venda && (
                            <p className="text-sm font-medium text-primary">
                              {formatPrice(variant.preco_venda)}
                            </p>
                          )}
                        </div>

                        {/* Add Button */}
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(variant)}
                          disabled={!hasStock}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overlay to close search results */}
      {showResults && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};