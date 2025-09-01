import React, { useState, useEffect } from 'react';
import { Plus, X, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProducts, Product, Supplier, ProductVariant } from '@/hooks/useProducts';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from '@/hooks/use-toast';

interface ProductModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { suppliers, createProduct, updateProduct, employee } = useProducts();
  const { createMultipleVariants } = useProductVariants();
  const { uploadImage, uploading } = useImageUpload();

  const [step, setStep] = useState(1);
  const [productData, setProductData] = useState({
    nome: '',
    modelo: '',
    categoria: '',
    fornecedor_id: '',
    valor_custo: '',
    impostos_percentual: '',
    is_consignado: false,
    observacoes: ''
  });

  const [variants, setVariants] = useState<Array<{
    cor: string;
    tamanho: string;
    referencia: string;
    preco_venda: string;
    quantidade_loja: string;
    quantidade_estoque: string;
    fotos: File[];
  }>>([]);

  const [colors, setColors] = useState('');
  const [sizes, setSizes] = useState('');
  const [generatedVariants, setGeneratedVariants] = useState<string[][]>([]);

  // Only show financial fields for proprietários
  const canEditFinancials = employee?.role === 'proprietario';

  useEffect(() => {
    if (product) {
      setProductData({
        nome: product.nome,
        modelo: product.modelo || '',
        categoria: product.categoria,
        fornecedor_id: product.fornecedor_id || '',
        valor_custo: product.valor_custo?.toString() || '',
        impostos_percentual: product.impostos_percentual?.toString() || '',
        is_consignado: product.is_consignado,
        observacoes: product.observacoes || ''
      });
    }
  }, [product]);

  const generateVariants = () => {
    const colorList = colors.split(',').map(c => c.trim()).filter(c => c);
    const sizeList = sizes.split(',').map(s => s.trim()).filter(s => s);
    
    if (colorList.length === 0 && sizeList.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos uma cor ou tamanho", variant: "destructive" });
      return;
    }

    const combinations: string[][] = [];
    
    if (colorList.length > 0 && sizeList.length > 0) {
      // Generate color x size combinations
      for (const color of colorList) {
        for (const size of sizeList) {
          combinations.push([color, size]);
        }
      }
    } else if (colorList.length > 0) {
      // Only colors
      for (const color of colorList) {
        combinations.push([color, '']);
      }
    } else {
      // Only sizes
      for (const size of sizeList) {
        combinations.push(['', size]);
      }
    }

    setGeneratedVariants(combinations);
    
    // Initialize variants array
    const newVariants = combinations.map(([cor, tamanho]) => ({
      cor,
      tamanho,
      referencia: `${productData.nome.substring(0, 3).toUpperCase()}-${cor || 'X'}-${tamanho || 'X'}`.replace(/\s/g, ''),
      preco_venda: '',
      quantidade_loja: '0',
      quantidade_estoque: '0',
      fotos: []
    }));
    
    setVariants(newVariants);
    setStep(3);
  };

  const handleVariantChange = (index: number, field: string, value: string | number | File[]) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleImageUpload = (index: number, files: FileList) => {
    const newVariants = [...variants];
    const existingFiles = newVariants[index].fotos || [];
    const newFiles = Array.from(files).slice(0, 4 - existingFiles.length);
    newVariants[index].fotos = [...existingFiles, ...newFiles];
    setVariants(newVariants);
  };

  const removeImage = (variantIndex: number, imageIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].fotos.splice(imageIndex, 1);
    setVariants(newVariants);
  };

  const handleSubmit = async () => {
    try {
      // Create or update product
      const productPayload = {
        ...productData,
        valor_custo: productData.valor_custo ? parseFloat(productData.valor_custo) : undefined,
        impostos_percentual: productData.impostos_percentual ? parseFloat(productData.impostos_percentual) : undefined,
      };

      let productId: string;
      
      if (product) {
        await updateProduct(product.id, productPayload);
        productId = product.id;
      } else {
        const newProduct = await createProduct(productPayload);
        if (!newProduct) return;
        productId = newProduct.id;
      }

      // Create variants if not editing existing product
      if (!product && variants.length > 0) {
        const variantPayloads = await Promise.all(
          variants.map(async (variant) => {
            const payload: any = {
              product_id: productId,
              referencia: variant.referencia,
              cor: variant.cor || null,
              tamanho: variant.tamanho || null,
              preco_venda: variant.preco_venda ? parseFloat(variant.preco_venda) : null,
              quantidade_loja: parseInt(variant.quantidade_loja) || 0,
              quantidade_estoque: parseInt(variant.quantidade_estoque) || 0
            };

            // Upload images
            if (variant.fotos && variant.fotos.length > 0) {
              const imageUrls = await Promise.all(
                variant.fotos.slice(0, 4).map(file => 
                  uploadImage(file, `produtos/${productId}`)
                )
              );

              imageUrls.forEach((url, index) => {
                if (url) {
                  payload[`foto_url_${index + 1}`] = url;
                }
              });
            }

            return payload;
          })
        );

        await createMultipleVariants(variantPayloads);
      }

      toast({ title: "Sucesso", description: `Produto ${product ? 'atualizado' : 'criado'} com sucesso` });
      onClose();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar produto", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <div className="w-12 h-1 bg-muted"></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <div className="w-12 h-1 bg-muted"></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
          </div>

          {/* Step 1: Product Information */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Informações do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Produto *</Label>
                    <Input
                      id="nome"
                      value={productData.nome}
                      onChange={(e) => setProductData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Camisa Polo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={productData.modelo}
                      onChange={(e) => setProductData(prev => ({ ...prev, modelo: e.target.value }))}
                      placeholder="Ex: Premium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Input
                      id="categoria"
                      value={productData.categoria}
                      onChange={(e) => setProductData(prev => ({ ...prev, categoria: e.target.value }))}
                      placeholder="Ex: Roupas"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Select value={productData.fornecedor_id} onValueChange={(value) => setProductData(prev => ({ ...prev, fornecedor_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {canEditFinancials && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valor_custo">Valor de Custo (R$)</Label>
                      <Input
                        id="valor_custo"
                        type="number"
                        step="0.01"
                        value={productData.valor_custo}
                        onChange={(e) => setProductData(prev => ({ ...prev, valor_custo: e.target.value }))}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="impostos_percentual">Impostos (%)</Label>
                      <Input
                        id="impostos_percentual"
                        type="number"
                        step="0.01"
                        value={productData.impostos_percentual}
                        onChange={(e) => setProductData(prev => ({ ...prev, impostos_percentual: e.target.value }))}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_consignado"
                    checked={productData.is_consignado}
                    onCheckedChange={(checked) => setProductData(prev => ({ ...prev, is_consignado: !!checked }))}
                  />
                  <Label htmlFor="is_consignado">Produto Consignado</Label>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={productData.observacoes}
                    onChange={(e) => setProductData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Informações adicionais sobre o produto"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setStep(2)} disabled={!productData.nome || !productData.categoria}>
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Variant Generator */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Gerador de Variantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="colors">Cores (separadas por vírgula)</Label>
                  <Input
                    id="colors"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="Ex: Azul, Vermelho, Verde"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sizes">Tamanhos (separados por vírgula)</Label>
                  <Input
                    id="sizes"
                    value={sizes}
                    onChange={(e) => setSizes(e.target.value)}
                    placeholder="Ex: P, M, G, GG"
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setStep(3)}>
                      Pular Variantes
                    </Button>
                    <Button onClick={generateVariants}>
                      Gerar Variantes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Variant Details */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Variantes</CardTitle>
              </CardHeader>
              <CardContent>
                {variants.length > 0 ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Cor</TableHead>
                          <TableHead>Tamanho</TableHead>
                          <TableHead>Preço (R$)</TableHead>
                          <TableHead>Qtd Loja</TableHead>
                          <TableHead>Qtd Estoque</TableHead>
                          <TableHead>Fotos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((variant, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={variant.referencia}
                                onChange={(e) => handleVariantChange(index, 'referencia', e.target.value)}
                                placeholder="SKU"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={variant.cor}
                                onChange={(e) => handleVariantChange(index, 'cor', e.target.value)}
                                placeholder="Cor"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={variant.tamanho}
                                onChange={(e) => handleVariantChange(index, 'tamanho', e.target.value)}
                                placeholder="Tamanho"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={variant.preco_venda}
                                onChange={(e) => handleVariantChange(index, 'preco_venda', e.target.value)}
                                placeholder="0,00"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={variant.quantidade_loja}
                                onChange={(e) => handleVariantChange(index, 'quantidade_loja', e.target.value)}
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={variant.quantidade_estoque}
                                onChange={(e) => handleVariantChange(index, 'quantidade_estoque', e.target.value)}
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-2">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) => e.target.files && handleImageUpload(index, e.target.files)}
                                  className="hidden"
                                  id={`file-${index}`}
                                />
                                <label htmlFor={`file-${index}`} className="cursor-pointer">
                                  <Button type="button" variant="outline" size="sm" asChild>
                                    <span>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload
                                    </span>
                                  </Button>
                                </label>
                                
                                {variant.fotos && variant.fotos.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {variant.fotos.map((file, imageIndex) => (
                                      <div key={imageIndex} className="relative w-12 h-12">
                                        <img
                                          src={URL.createObjectURL(file)}
                                          alt={`Preview ${imageIndex + 1}`}
                                          className="w-full h-full object-cover rounded border"
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          className="absolute -top-1 -right-1 w-5 h-5 p-0"
                                          onClick={() => removeImage(index, imageIndex)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma variante foi gerada. Clique em "Salvar Produto" para criar apenas o produto principal.
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Voltar
                  </Button>
                  <Button onClick={handleSubmit} disabled={uploading}>
                    {uploading ? 'Salvando...' : (product ? 'Atualizar Produto' : 'Salvar Produto')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};