import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from '@/lib/utils';
import { Product, ProductVariant } from '@/hooks/useProducts';

interface ProductConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productData: {
    nome: string;
    categoria: string;
    modelo: string;
    fornecedor_id: string;
    valor_custo: string;
    impostos_percentual: string;
    is_consignado: boolean;
    observacoes: string;
  };
  variants: Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>[];
  loading?: boolean;
}

export const ProductConfirmationModal: React.FC<ProductConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productData,
  variants,
  loading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar Criação do Produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Nome:</span>
                  <p className="text-muted-foreground">{productData.nome}</p>
                </div>
                <div>
                  <span className="font-medium">Categoria:</span>
                  <p className="text-muted-foreground">{productData.categoria}</p>
                </div>
                {productData.modelo && (
                  <div>
                    <span className="font-medium">Modelo:</span>
                    <p className="text-muted-foreground">{productData.modelo}</p>
                  </div>
                )}
                {productData.valor_custo && (
                  <div>
                    <span className="font-medium">Valor de Custo:</span>
                    <p className="text-muted-foreground">{formatPrice(parseFloat(productData.valor_custo))}</p>
                  </div>
                )}
                {productData.impostos_percentual && (
                  <div>
                    <span className="font-medium">Impostos:</span>
                    <p className="text-muted-foreground">{productData.impostos_percentual}%</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Consignado:</span>
                  <p className="text-muted-foreground">{productData.is_consignado ? 'Sim' : 'Não'}</p>
                </div>
              </div>
              {productData.observacoes && (
                <div>
                  <span className="font-medium">Observações:</span>
                  <p className="text-muted-foreground">{productData.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variantes ({variants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variants.map((variant, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {variant.referencia}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {variant.cor && (
                        <div className="text-sm">
                          <span className="font-medium">Cor:</span> {variant.cor}
                        </div>
                      )}
                      {variant.tamanho && (
                        <div className="text-sm">
                          <span className="font-medium">Tamanho:</span> {variant.tamanho}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Preço:</span> {formatPrice(variant.preco_venda)}
                      </div>
                      {variant.impostos_percentual && (
                        <div className="text-sm">
                          <span className="font-medium">Impostos:</span> {variant.impostos_percentual}%
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Estoque Loja:</span> {variant.quantidade_loja}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Estoque:</span> {variant.quantidade_estoque}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold px-8 py-3 text-lg"
              size="lg"
            >
              {loading ? 'Criando...' : 'Criar Produto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};