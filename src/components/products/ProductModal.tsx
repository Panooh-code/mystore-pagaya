import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, Plus, Upload, Trash2, ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useProducts, Product, ProductVariant } from '@/hooks/useProducts';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProductModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { suppliers, createProduct, updateProduct, employee } = useProducts();
  const { createVariant, updateVariant } = useProductVariants();
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

  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');

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
      
      // If editing, skip to variant details if variants exist
      if (product.variants && product.variants.length > 0) {
        setStep(3);
        setGeneratedVariants(product.variants.map(v => ({
          ...v,
          preco_venda: v.preco_venda?.toString() || '',
          quantidade_loja: v.quantidade_loja.toString(),
          quantidade_estoque: v.quantidade_estoque.toString(),
          imageFiles: []
        })));
      }
    } else {
      // Reset for new product
      setStep(1);
      setProductData({
        nome: '',
        modelo: '',
        categoria: '',
        fornecedor_id: '',
        valor_custo: '',
        impostos_percentual: '',
        is_consignado: false,
        observacoes: ''
      });
      setColors([]);
      setSizes([]);
      setGeneratedVariants([]);
    }
  }, [product, isOpen]);

  const addColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      setColors([...colors, colorInput.trim()]);
      setColorInput('');
    }
  };

  const addSize = () => {
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
      setSizes([...sizes, sizeInput.trim()]);
      setSizeInput('');
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter(c => c !== color));
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter(s => s !== size));
  };

  const generateVariants = () => {
    if (colors.length === 0 && sizes.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos uma cor ou tamanho", variant: "destructive" });
      return;
    }

    const variants: any[] = [];
    
    if (colors.length > 0 && sizes.length > 0) {
      // Generate color x size combinations
      colors.forEach(color => {
        sizes.forEach(size => {
          variants.push({
            id: null,
            referencia: `${productData.nome.substring(0, 3).toUpperCase()}-${color.substring(0, 3).toUpperCase()}-${size}`.replace(/\s/g, ''),
            cor: color,
            tamanho: size,
            preco_venda: '',
            quantidade_loja: '0',
            quantidade_estoque: '0',
            imageFiles: []
          });
        });
      });
    } else if (colors.length > 0) {
      // Only colors
      colors.forEach(color => {
        variants.push({
          id: null,
          referencia: `${productData.nome.substring(0, 3).toUpperCase()}-${color.substring(0, 3).toUpperCase()}`.replace(/\s/g, ''),
          cor: color,
          tamanho: '',
          preco_venda: '',
          quantidade_loja: '0',
          quantidade_estoque: '0',
          imageFiles: []
        });
      });
    } else {
      // Only sizes
      sizes.forEach(size => {
        variants.push({
          id: null,
          referencia: `${productData.nome.substring(0, 3).toUpperCase()}-${size}`.replace(/\s/g, ''),
          cor: '',
          tamanho: size,
          preco_venda: '',
          quantidade_loja: '0',
          quantidade_estoque: '0',
          imageFiles: []
        });
      });
    }

    setGeneratedVariants(variants);
    setStep(3);
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...generatedVariants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setGeneratedVariants(newVariants);
  };

  const handleImageUpload = (index: number, files: FileList | null) => {
    if (!files) return;
    
    const newVariants = [...generatedVariants];
    const existingFiles = newVariants[index].imageFiles || [];
    const newFiles = Array.from(files).slice(0, 4 - existingFiles.length);
    newVariants[index].imageFiles = [...existingFiles, ...newFiles];
    setGeneratedVariants(newVariants);
  };

  const removeImage = (variantIndex: number, imageIndex: number) => {
    const newVariants = [...generatedVariants];
    newVariants[variantIndex].imageFiles.splice(imageIndex, 1);
    setGeneratedVariants(newVariants);
  };

  const handleSubmit = async () => {
    if (step === 1) {
      // Validate required fields
      if (!productData.nome?.trim()) {
        toast({ title: "Erro", description: "Nome do produto é obrigatório", variant: "destructive" });
        return;
      }
      if (!productData.categoria?.trim()) {
        toast({ title: "Erro", description: "Categoria é obrigatória", variant: "destructive" });
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      // Validate variants generation
      if (colors.length === 0 && sizes.length === 0) {
        toast({ title: "Erro", description: "Adicione pelo menos uma cor ou tamanho", variant: "destructive" });
        return;
      }
      generateVariants();
      return;
    }

    // Step 3 - Final submission
    try {
      let productId = product?.id;
      
      // Prepare product data
      const productPayload = {
        ...productData,
        valor_custo: productData.valor_custo ? parseFloat(productData.valor_custo) : undefined,
        impostos_percentual: productData.impostos_percentual ? parseFloat(productData.impostos_percentual) : undefined,
      };
      
      if (!product) {
        // Create new product
        const newProduct = await createProduct(productPayload);
        if (!newProduct) {
          toast({ title: "Erro", description: "Erro ao criar produto", variant: "destructive" });
          return;
        }
        productId = newProduct.id;
      } else {
        // Update existing product
        const success = await updateProduct(product.id, productPayload);
        if (!success) {
          toast({ title: "Erro", description: "Erro ao atualizar produto", variant: "destructive" });
          return;
        }
      }

      // Process variants with image uploads
      const variantPromises = generatedVariants.map(async (variant) => {
        const variantData = { 
          ...variant, 
          product_id: productId,
          preco_venda: variant.preco_venda ? parseFloat(variant.preco_venda) : null,
          quantidade_loja: parseInt(variant.quantidade_loja) || 0,
          quantidade_estoque: parseInt(variant.quantidade_estoque) || 0
        };
        
        // Upload images sequentially to avoid overwhelming the server
        if (variant.imageFiles && variant.imageFiles.length > 0) {
          for (let i = 0; i < Math.min(variant.imageFiles.length, 4); i++) {
            const imageFile = variant.imageFiles[i];
            try {
              const imageUrl = await uploadImage(imageFile, `produtos/${productId}`);
              if (imageUrl) {
                variantData[`foto_url_${i + 1}`] = imageUrl;
              }
            } catch (error) {
              console.error(`Error uploading image ${i + 1}:`, error);
            }
          }
        }
        
        // Create or update variant
        try {
          if (variant.id) {
            await updateVariant(variant.id, variantData);
          } else {
            await createVariant(variantData);
          }
        } catch (error) {
          console.error('Error saving variant:', error);
          throw error;
        }
      });

      await Promise.all(variantPromises);
      
      toast({ 
        title: "Sucesso", 
        description: product ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!" 
      });
      onClose();
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao salvar produto. Tente novamente.", 
        variant: "destructive" 
      });
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Informações Básicas'
      case 2: return 'Cores e Tamanhos'
      case 3: return 'Detalhes das Variantes'
      default: return ''
    }
  }

  const isSubmitting = uploading
  const progress = step === 3 ? (uploading ? 50 : 100) : (step / 3) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product ? 'Editar Produto' : 'Novo Produto'}
            <Badge variant="outline" className="text-xs">
              Passo {step} de 3
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{getStepTitle()}</p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Informações</span>
            <span>Variantes</span>
            <span>Finalizar</span>
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
                  <Label htmlFor="nome" className="flex items-center gap-1">
                    Nome do Produto 
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={productData.nome}
                    onChange={(e) => setProductData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Camisa Polo"
                    className={!productData.nome?.trim() ? "border-destructive" : ""}
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
                  <Label htmlFor="categoria" className="flex items-center gap-1">
                    Categoria 
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="categoria"
                    value={productData.categoria}
                    onChange={(e) => setProductData(prev => ({ ...prev, categoria: e.target.value }))}
                    placeholder="Ex: Roupas, Calçados, Acessórios"
                    className={!productData.categoria?.trim() ? "border-destructive" : ""}
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Variant Generator */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Configurar Variantes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Adicione cores e tamanhos para gerar automaticamente as variantes do produto
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Cores</Label>
                <div className="flex gap-2">
                  <Input
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    placeholder="Ex: Azul, Vermelho"
                    onKeyPress={(e) => e.key === 'Enter' && addColor()}
                  />
                  <Button type="button" onClick={addColor} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <Badge key={color} variant="secondary" className="flex items-center gap-1">
                      {color}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeColor(color)} />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Tamanhos</Label>
                <div className="flex gap-2">
                  <Input
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    placeholder="Ex: P, M, G"
                    onKeyPress={(e) => e.key === 'Enter' && addSize()}
                  />
                  <Button type="button" onClick={addSize} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <Badge key={size} variant="secondary" className="flex items-center gap-1">
                      {size}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeSize(size)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {colors.length === 0 && sizes.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Adicione pelo menos uma cor ou tamanho para continuar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Variant Details */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes das Variantes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure preços, estoque e imagens para cada variante
              </p>
            </CardHeader>
            <CardContent>
              {generatedVariants.length > 0 ? (
                <div className="space-y-6">
                  {generatedVariants.map((variant, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label>SKU/Referência</Label>
                          <Input
                            value={variant.referencia}
                            onChange={(e) => handleVariantChange(index, 'referencia', e.target.value)}
                            placeholder="SKU"
                          />
                        </div>
                        <div>
                          <Label>Cor</Label>
                          <Input
                            value={variant.cor}
                            onChange={(e) => handleVariantChange(index, 'cor', e.target.value)}
                            placeholder="Cor"
                          />
                        </div>
                        <div>
                          <Label>Tamanho</Label>
                          <Input
                            value={variant.tamanho}
                            onChange={(e) => handleVariantChange(index, 'tamanho', e.target.value)}
                            placeholder="Tamanho"
                          />
                        </div>
                        <div>
                          <Label>Preço de Venda (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.preco_venda}
                            onChange={(e) => handleVariantChange(index, 'preco_venda', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Quantidade na Loja</Label>
                          <Input
                            type="number"
                            value={variant.quantidade_loja}
                            onChange={(e) => handleVariantChange(index, 'quantidade_loja', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label>Quantidade no Estoque</Label>
                          <Input
                            type="number"
                            value={variant.quantidade_estoque}
                            onChange={(e) => handleVariantChange(index, 'quantidade_estoque', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Imagens (máximo 4)</Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(index, e.target.files)}
                            className="hidden"
                            id={`images-${index}`}
                          />
                          <div className="flex flex-wrap gap-2">
                            {variant.imageFiles?.map((file: File, imgIndex: number) => (
                              <div key={imgIndex} className="relative">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                  onClick={() => removeImage(index, imgIndex)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            {(!variant.imageFiles || variant.imageFiles.length < 4) && (
                              <label
                                htmlFor={`images-${index}`}
                                className="w-16 h-16 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                              >
                                <Upload className="h-6 w-6 text-muted-foreground" />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma variante configurada ainda.</p>
                  <Button variant="outline" onClick={() => setStep(2)} className="mt-2">
                    Voltar para configurar variantes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || (step === 1 && (!productData.nome?.trim() || !productData.categoria?.trim()))}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {step === 3 ? 'Salvando...' : 'Processando...'}
              </>
            ) : (
              <>
                {step === 3 ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {product ? 'Atualizar Produto' : 'Criar Produto'}
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};