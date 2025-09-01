import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Edit, Trash, Package, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProducts, Product, ProductVariant } from '@/hooks/useProducts';
import { useProductVariants } from '@/hooks/useProductVariants';
import { ProductModal } from '@/components/products/ProductModal';
import { StockMovementModal } from '@/components/products/StockMovementModal';
import { formatPrice } from '@/lib/utils';

export default function Produtos() {
  const { products, loading, isAdmin, employee } = useProducts();
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const toggleExpanded = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const getStockBadgeVariant = (quantidade: number) => {
    if (quantidade === 0) return 'destructive';
    if (quantidade < 5) return 'secondary';
    return 'default';
  };


  // Only show cost and tax fields for proprietários
  const canViewFinancials = employee?.role === 'proprietario';

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="glass-card border-0">
          <CardContent className="p-6">
            <div className="text-center">Carregando produtos...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-0">
        <CardHeader className="space-y-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestão de Produtos
          </CardTitle>
          {isAdmin && (
            <div className="flex justify-center">
              <Button 
                onClick={() => setIsProductModalOpen(true)}
                className="bg-gradient-primary hover:opacity-90 text-white font-medium px-6 py-2"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Estoque Total</TableHead>
                {canViewFinancials && <TableHead>Custo</TableHead>}
                {isAdmin && <TableHead className="w-20">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isExpanded = expandedProducts.has(product.id);
                const totalStock = product.variants?.reduce((acc, variant) => 
                  acc + variant.quantidade_loja + variant.quantidade_estoque, 0) || 0;
                
                return (
                  <React.Fragment key={product.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpanded(product.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.nome}</div>
                          {product.modelo && <div className="text-sm text-muted-foreground">{product.modelo}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.categoria}</Badge>
                      </TableCell>
                      <TableCell>{product.variants?.length || 0}</TableCell>
                      <TableCell>
                        <Badge variant={getStockBadgeVariant(totalStock)}>
                          {totalStock}
                        </Badge>
                      </TableCell>
                      {canViewFinancials && (
                        <TableCell>{formatPrice(product.valor_custo)}</TableCell>
                      )}
                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                                setIsProductModalOpen(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                                setIsStockModalOpen(true);
                              }}>
                                <Package className="h-4 w-4 mr-2" />
                                Movimentar Estoque
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                    
                    {isExpanded && product.variants && product.variants.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? (canViewFinancials ? 7 : 6) : (canViewFinancials ? 6 : 5)} className="p-0">
                          <div className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {product.variants.map((variant) => (
                                <div key={variant.id} className="bg-card rounded-lg p-3 border">
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Badge variant="secondary" className="text-xs">
                                        {variant.referencia}
                                      </Badge>
                                      {variant.foto_url_1 && (
                                        <div className="w-8 h-8 bg-muted rounded overflow-hidden">
                                          <img 
                                            src={variant.foto_url_1} 
                                            alt={`${variant.cor} ${variant.tamanho}`}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-sm">
                                      {variant.cor && <span className="font-medium">{variant.cor}</span>}
                                      {variant.cor && variant.tamanho && <span className="text-muted-foreground"> • </span>}
                                      {variant.tamanho && <span>{variant.tamanho}</span>}
                                    </div>
                                    <div className="text-sm">
                                      <div className="font-medium">{formatPrice(variant.preco_venda)}</div>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Loja: </span>
                                        <Badge variant={getStockBadgeVariant(variant.quantidade_loja)} className="text-xs">
                                          {variant.quantidade_loja}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Estoque: </span>
                                        <Badge variant={getStockBadgeVariant(variant.quantidade_estoque)} className="text-xs">
                                          {variant.quantidade_estoque}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto cadastrado ainda.</p>
              {isAdmin && (
                <Button 
                  onClick={() => setIsProductModalOpen(true)}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Produto
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Modal */}
      {isProductModalOpen && (
        <ProductModal 
          product={selectedProduct}
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Stock Movement Modal */}
      {isStockModalOpen && selectedProduct && (
        <StockMovementModal 
          product={selectedProduct}
          isOpen={isStockModalOpen}
          onClose={() => {
            setIsStockModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}