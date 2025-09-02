import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ArrowRight, Plus, X, Upload, Trash2 } from 'lucide-react';
import { useProducts, Product, ProductVariant } from '@/hooks/useProducts';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useEmployee } from '@/hooks/useEmployee'; // <-- Adicionado para buscar o cargo do usuário
import { ProductConfirmationModal } from './ProductConfirmationModal';
import { formatPrice, parseMultipleInputs } from '@/lib/utils';

interface ProductModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'Masculino',
  'Feminino',
  'Infantil',
  'Acessórios',
  'Calçado',
  'Calçado Infantil',
  'Outros'
];

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { suppliers, createProduct, updateProduct, fetchProducts } = useProducts();
  const { createMultipleVariants, updateVariant } = useProductVariants();
  const { uploadImage } = useImageUpload();
  const { toast } = useToast();
  const { employee } = useEmployee(); // <-- Hook para obter dados do funcionário logado

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Product data
  const [productData, setProductData] = useState({
    nome: '',
    categoria: '',
    modelo: '',
    fornecedor_id: '',
    valor_custo: '',
    impostos_percentual: '',
    is_consignado: false,
    observacoes: ''
  });

  // Variant generation
  const [colorsInput, setColorsInput] = useState('');
  const [sizesInput, setSizesInput] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);

  // Generated variants
  const [variants, setVariants] = useState<Array<Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>>>([]);

  // Inheritance values
  const [inheritanceValues, setInheritanceValues] = useState({
    preco_venda: '',
    impostos_percentual: '',
    referencia_base: '',
    use_suffixes: false,
    suffixes: ''
  });

  // Color photo inheritance
  const [colorPhotos, setColorPhotos] = useState<Record<string, string>>({});

  const isEditing = !!product;
  const isOwner = employee?.role === 'proprietario'; // <-- Verifica se o usuário é proprietário

  // Initialize form data
  useEffect(() => {
    if (product) {
      setProductData({
        nome: product.nome || '',
        categoria: product.categoria || '',
        modelo: product.modelo || '',
        fornecedor_id: product.fornecedor_id || '',
        // Apenas preenche os campos de custo se o usuário for proprietário
        valor_custo: isOwner ? product.valor_custo?.toString() || '' : '',
        impostos_percentual: isOwner ? product.impostos_percentual?.toString() || '' : '',
        is_consignado: product.is_consignado || false,
        observacoes: product.observacoes || ''
      });

      if (product.variants) {
        setVariants(product.variants.map(v => ({
          referencia: v.referencia,
          cor: v.cor || '',
          tamanho: v.tamanho || '',
          preco_venda: v.preco_venda || 0,
          // Apenas preenche o imposto da variante se for proprietário
          impostos_percentual: isOwner ? v.impostos_percentual || 0 : 0,
          quantidade_loja: v.quantidade_loja || 0,
          quantidade_estoque: v.quantidade_estoque || 0,
          local_loja: v.local_loja || '',
          local_estoque: v.local_estoque || '',
          foto_url_1: v.foto_url_1 || '',
          foto_url_2: v.foto_url_2 || '',
          foto_url_3: v.foto_url_3 || '',
          foto_url_4: v.foto_url_4 || ''
        })));
        setCurrentStep(3); // Go directly to variants details when editing
      }
    } else {
      // Reset form for new product
      setProductData({
        nome: '',
        categoria: '',
        modelo: '',
        fornecedor_id: '',
        valor_custo: '',
        impostos_percentual: '',
        is_consignado: false,
        observacoes: ''
      });
      setColors([]);
      setSizes([]);
      setVariants([]);
      setColorsInput('');
      setSizesInput('');
      setCurrentStep(1);
      setInheritanceValues({
        preco_venda: '',
        impostos_percentual: '',
        referencia_base: '',
        use_suffixes: false,
        suffixes: ''
      });
      setColorPhotos({});
    }
  }, [product, isOpen, isOwner]);

  // Parse colors and sizes from input
  const handleColorsInputChange = (value: string) => {
    setColorsInput(value);
    const parsedColors = parseMultipleInputs(value);
    setColors(parsedColors);
  };

  const handleSizesInputChange = (value: string) => {
    setSizesInput(value);
    const parsedSizes = parseMultipleInputs(value);
    setSizes(parsedSizes);
  };

  // Generate variants based on colors and sizes
  const generateVariants = () => {
    const newVariants: Array<Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>> = [];
    const suffixList = inheritanceValues.use_suffixes && inheritanceValues.suffixes
      ? parseMultipleInputs(inheritanceValues.suffixes)
      : [];

    if (colors.length === 0 && sizes.length === 0) {
      // No colors or sizes, create one variant
      const baseSuffix = suffixList.length > 0 ? `-${suffixList[0]}` : '';
      newVariants.push({
        referencia: inheritanceValues.referencia_base
          ? `${inheritanceValues.referencia_base}${baseSuffix}`
          : `${productData.nome.slice(0, 3).toUpperCase()}001`,
        cor: '',
        tamanho: '',
        preco_venda: parseFloat(inheritanceValues.preco_venda) || 0,
        impostos_percentual: isOwner ? parseFloat(inheritanceValues.impostos_percentual) || 0 : 0,
        quantidade_loja: 0,
        quantidade_estoque: 0,
        local_loja: '',
        local_estoque: '',
        foto_url_1: '',
        foto_url_2: '',
        foto_url_3: '',
        foto_url_4: ''
      });
    } else if (colors.length > 0 && sizes.length === 0) {
      // Only colors
      colors.forEach((color, colorIndex) => {
        const suffix = inheritanceValues.use_suffixes && suffixList.length > colorIndex
          ? `-${suffixList[colorIndex]}`
          : inheritanceValues.use_suffixes ? `-${String(colorIndex + 1).padStart(2, '0')}` : '';

        const existingPhoto = colorPhotos[color] || '';

        newVariants.push({
          referencia: inheritanceValues.referencia_base
            ? `${inheritanceValues.referencia_base}${suffix}`
            : `${productData.nome.slice(0, 3).toUpperCase()}${String(colorIndex + 1).padStart(3, '0')}`,
          cor: color,
          tamanho: '',
          preco_venda: parseFloat(inheritanceValues.preco_venda) || 0,
          impostos_percentual: isOwner ? parseFloat(inheritanceValues.impostos_percentual) || 0 : 0,
          quantidade_loja: 0,
          quantidade_estoque: 0,
          local_loja: '',
          local_estoque: '',
          foto_url_1: existingPhoto,
          foto_url_2: '',
          foto_url_3: '',
          foto_url_4: ''
        });
      });
    } else if (colors.length === 0 && sizes.length > 0) {
      // Only sizes
      sizes.forEach((size, sizeIndex) => {
        const suffix = inheritanceValues.use_suffixes && suffixList.length > sizeIndex
          ? `-${suffixList[sizeIndex]}`
          : inheritanceValues.use_suffixes ? `-${String(sizeIndex + 1).padStart(2, '0')}` : '';

        newVariants.push({
          referencia: inheritanceValues.referencia_base
            ? `${inheritanceValues.referencia_base}${suffix}`
            : `${productData.nome.slice(0, 3).toUpperCase()}${String(sizeIndex + 1).padStart(3, '0')}`,
          cor: '',
          tamanho: size,
          preco_venda: parseFloat(inheritanceValues.preco_venda) || 0,
          impostos_percentual: isOwner ? parseFloat(inheritanceValues.impostos_percentual) || 0 : 0,
          quantidade_loja: 0,
          quantidade_estoque: 0,
          local_loja: '',
          local_estoque: '',
          foto_url_1: '',
          foto_url_2: '',
          foto_url_3: '',
          foto_url_4: ''
        });
      });
    } else {
      // Both colors and sizes
      let counter = 0;
      colors.forEach((color, colorIndex) => {
        const existingPhoto = colorPhotos[color] || '';
        sizes.forEach((size, sizeIndex) => {
          const suffix = inheritanceValues.use_suffixes && suffixList.length > counter
            ? `-${suffixList[counter]}`
            : inheritanceValues.use_suffixes ? `-${String(counter + 1).padStart(2, '0')}` : '';

          newVariants.push({
            referencia: inheritanceValues.referencia_base
              ? `${inheritanceValues.referencia_base}${suffix}`
              : `${productData.nome.slice(0, 3).toUpperCase()}${String(counter + 1).padStart(3, '0')}`,
            cor: color,
            tamanho: size,
            preco_venda: parseFloat(inheritanceValues.preco_venda) || 0,
            impostos_percentual: isOwner ? parseFloat(inheritanceValues.impostos_percentual) || 0 : 0,
            quantidade_loja: 0,
            quantidade_estoque: 0,
            local_loja: '',
            local_estoque: '',
            foto_url_1: existingPhoto,
            foto_url_2: '',
            foto_url_3: '',
            foto_url_4: ''
          });
          counter++;
        });
      });
    }

    setVariants(newVariants);
    setCurrentStep(3);
  };

  // Handle variant field changes
  const handleVariantChange = (index: number, field: string, value: string | number) => {
    const updatedVariants = [...variants];
    const currentVariant = updatedVariants[index];

    if (field === 'preco_venda' || field === 'impostos_percentual' || field === 'quantidade_loja' || field === 'quantidade_estoque') {
      updatedVariants[index] = {
        ...currentVariant,
        [field]: parseFloat(value as string) || 0
      };
    } else {
      updatedVariants[index] = {
        ...currentVariant,
        [field]: value
      };
    }

    // Handle photo inheritance by color
    if (field.startsWith('foto_url_') && currentVariant.cor) {
      const newPhoto = value as string;
      if (newPhoto && !colorPhotos[currentVariant.cor]) {
        setColorPhotos(prev => ({ ...prev, [currentVariant.cor!]: newPhoto }));

        // Apply to all variants with the same color
        const sameColorVariants = updatedVariants.filter((v, i) =>
          i !== index && v.cor === currentVariant.cor && !v.foto_url_1
        );
        sameColorVariants.forEach(variant => {
          variant.foto_url_1 = newPhoto;
        });
      }
    }

    setVariants(updatedVariants);
  };

  // Apply inheritance values to all variants
  const applyInheritanceToAll = () => {
    if (!inheritanceValues.preco_venda && !inheritanceValues.impostos_percentual && !inheritanceValues.referencia_base) {
      toast({
        title: "Aviso",
        description: "Defina valores para aplicar às variantes",
        variant: "destructive"
      });
      return;
    }

    const suffixList = inheritanceValues.use_suffixes && inheritanceValues.suffixes
      ? parseMultipleInputs(inheritanceValues.suffixes)
      : [];

    const updatedVariants = variants.map((variant, index) => {
      const updates: any = { ...variant };

      if (inheritanceValues.preco_venda) {
        updates.preco_venda = parseFloat(inheritanceValues.preco_venda);
      }

      if (isOwner && inheritanceValues.impostos_percentual) {
        updates.impostos_percentual = parseFloat(inheritanceValues.impostos_percentual);
      }

      if (inheritanceValues.referencia_base) {
        const suffix = inheritanceValues.use_suffixes && suffixList.length > index
          ? `-${suffixList[index]}`
          : inheritanceValues.use_suffixes ? `-${String(index + 1).padStart(2, '0')}` : '';
        updates.referencia = `${inheritanceValues.referencia_base}${suffix}`;
      }

      return updates;
    });

    setVariants(updatedVariants);

    toast({
      title: "Valores aplicados",
      description: `Valores aplicados a ${variants.length} variantes`
    });
  };

  // Handle image upload
  const handleImageUpload = async (variantIndex: number, files: FileList | null, imageIndex: number) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const imageUrl = await uploadImage(file, 'variants');

    if (imageUrl) {
      handleVariantChange(variantIndex, `foto_url_${imageIndex}`, imageUrl);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!productData.nome.trim() || !productData.categoria) {
        toast({
          title: "Erro",
          description: "Nome e categoria são obrigatórios",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Generate variants and go to step 3
      generateVariants();
    } else if (currentStep === 3) {
      // Show confirmation modal
      setShowConfirmation(true);
    }
  };

  // Final submission
  const handleFinalSubmit = async () => {
    setSubmitting(true);

    try {
      const productPayload = {
        nome: productData.nome,
        categoria: productData.categoria,
        modelo: productData.modelo || null,
        fornecedor_id: productData.fornecedor_id || null,
        // Apenas inclui os campos de custo se o usuário for proprietário
        valor_custo: isOwner && productData.valor_custo ? parseFloat(productData.valor_custo) : null,
        impostos_percentual: isOwner && productData.impostos_percentual ? parseFloat(productData.impostos_percentual) : 0,
        is_consignado: productData.is_consignado,
        observacoes: productData.observacoes || null
      };

      let savedProduct;
      if (isEditing) {
        const success = await updateProduct(product!.id, productPayload);
        if (success) {
          savedProduct = { ...product, ...productPayload };
        } else {
          throw new Error('Failed to update product');
        }
      } else {
        savedProduct = await createProduct(productPayload);
        if (!savedProduct) {
          throw new Error('Failed to create product');
        }
      }

      if (savedProduct && variants.length > 0) {
        const variantsWithProductId = variants.map(variant => ({
          ...variant,
          product_id: savedProduct.id
        }));

        if (isEditing) {
          // Update existing variants
          for (const variant of variants) {
            const existingVariant = product!.variants?.find(v => v.referencia === variant.referencia);
            if (existingVariant) {
              await updateVariant(existingVariant.id, variant);
            }
          }
        } else {
          // Create new variants
          const success = await createMultipleVariants(variantsWithProductId);
          if (!success || success.length === 0) {
            throw new Error('Failed to create variants');
          }
        }
      }

      await fetchProducts();

      toast({
        title: "Sucesso",
        description: isEditing ? "Produto atualizado com sucesso" : "Produto criado com sucesso"
      });

      // Close modal and redirect
      setShowConfirmation(false);
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar produto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <>
      <Dialog open={isOpen && !showConfirmation} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <Progress value={progress} className="mt-2" />
            <div className="text-sm text-muted-foreground">
              Etapa {currentStep} de 3: {
                currentStep === 1 ? 'Informações do Produto' :
                currentStep === 2 ? 'Gerador de Variantes' :
                'Detalhes das Variantes'
              }
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Product Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Produto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="nome" className="text-sm font-medium">
                      Nome do Produto *
                    </Label>
                    <Input
                      id="nome"
                      value={productData.nome}
                      onChange={(e) => setProductData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Digite o nome do produto"
                      className="mt-1"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="categoria" className="text-sm font-medium">
                      Categoria *
                    </Label>
                    <Select
                      value={productData.categoria}
                      onValueChange={(value) => setProductData(prev => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Input
                        id="modelo"
                        value={productData.modelo}
                        onChange={(e) => setProductData(prev => ({ ...prev, modelo: e.target.value }))}
                        placeholder="Modelo do produto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fornecedor">Fornecedor</Label>
                      <Select
                        value={productData.fornecedor_id}
                        onValueChange={(value) => setProductData(prev => ({ ...prev, fornecedor_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* --- Campos Restritos ao Proprietário --- */}
                  {isOwner && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-amber-500/30 rounded-lg bg-amber-500/5">
                      <div className="space-y-2">
                        <Label htmlFor="valor_custo" className="text-amber-600">Valor de Custo (€)</Label>
                        <Input
                          id="valor_custo"
                          type="number"
                          step="0.01"
                          value={productData.valor_custo}
                          onChange={(e) => setProductData(prev => ({ ...prev, valor_custo: e.target.value }))}
                          placeholder="0.00 (visível apenas para proprietários)"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="impostos" className="text-amber-600">Impostos (%)</Label>
                        <Input
                          id="impostos"
                          type="number"
                          step="0.01"
                          value={productData.impostos_percentual}
                          onChange={(e) => setProductData(prev => ({ ...prev, impostos_percentual: e.target.value }))}
                          placeholder="0.00 (visível apenas para proprietários)"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="consignado"
                      checked={productData.is_consignado}
                      onCheckedChange={(checked) => setProductData(prev => ({ ...prev, is_consignado: checked }))}
                    />
                    <Label htmlFor="consignado">Produto consignado</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={productData.observacoes}
                      onChange={(e) => setProductData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Observações sobre o produto"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Variant Generator */}
            {currentStep === 2 && !isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Gerador de Variantes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="referencia_base">Código de Referência Base</Label>
                      <Input
                        id="referencia_base"
                        value={inheritanceValues.referencia_base}
                        onChange={(e) => setInheritanceValues(prev => ({ ...prev, referencia_base: e.target.value }))}
                        placeholder="Ex: ABC (será usado como ABC-A1, ABC-B2...)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Se não preenchido, será gerado automaticamente com base no nome do produto
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="preco_heranca">Preço de Venda (€)</Label>
                        <Input
                          id="preco_heranca"
                          type="number"
                          step="0.01"
                          value={inheritanceValues.preco_venda}
                          onChange={(e) => setInheritanceValues(prev => ({ ...prev, preco_venda: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>

                      {/* Campo de imposto na herança visível apenas para proprietário */}
                      {isOwner && (
                        <div className="space-y-2">
                          <Label htmlFor="impostos_heranca" className="text-amber-600">Impostos (%)</Label>
                          <Input
                            id="impostos_heranca"
                            type="number"
                            step="0.01"
                            value={inheritanceValues.impostos_percentual}
                            onChange={(e) => setInheritanceValues(prev => ({ ...prev, impostos_percentual: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suffix Configuration */}
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use_suffixes"
                        checked={inheritanceValues.use_suffixes}
                        onCheckedChange={(checked) => setInheritanceValues(prev => ({ ...prev, use_suffixes: checked }))}
                      />
                      <Label htmlFor="use_suffixes" className="font-medium">Usar sufixos personalizados para referências</Label>
                    </div>

                    {inheritanceValues.use_suffixes && (
                      <div className="space-y-2">
                        <Label htmlFor="suffixes">Sufixos</Label>
                        <Input
                          id="suffixes"
                          value={inheritanceValues.suffixes}
                          onChange={(e) => setInheritanceValues(prev => ({ ...prev, suffixes: e.target.value }))}
                          placeholder="Ex: A1, B2, C3 ou 01, 02, 03"
                        />
                        <p className="text-xs text-muted-foreground">
                          Separe os sufixos por vírgula ou ponto e vírgula. Serão aplicados em sequência após "-" no código de referência.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cores">Cores</Label>
                      <Input
                        id="cores"
                        value={colorsInput}
                        onChange={(e) => handleColorsInputChange(e.target.value)}
                        placeholder="Ex: Azul, Vermelho; Verde, Preto"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separe as cores por vírgula ou ponto e vírgula.
                      </p>
                      {colors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {colors.map((color, index) => (
                            <Badge key={index} variant="secondary">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tamanhos">Tamanhos</Label>
                      <Input
                        id="tamanhos"
                        value={sizesInput}
                        onChange={(e) => handleSizesInputChange(e.target.value)}
                        placeholder="Ex: P, M, G; 38, 40, 42"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separe os tamanhos por vírgula ou ponto e vírgula.
                      </p>
                      {sizes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sizes.map((size, index) => (
                            <Badge key={index} variant="secondary">
                              {size}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {colors.length === 0 && sizes.length === 0 &&
                        "Será criada 1 variante sem cor nem tamanho."
                      }
                      {colors.length > 0 && sizes.length === 0 &&
                        `Serão criadas ${colors.length} variantes (só cores).`
                      }
                      {colors.length === 0 && sizes.length > 0 &&
                        `Serão criadas ${sizes.length} variantes (só tamanhos).`
                      }
                      {colors.length > 0 && sizes.length > 0 &&
                        `Serão criadas ${colors.length * sizes.length} variantes (cores × tamanhos).`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Variant Details */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Detalhes das Variantes</span>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={applyInheritanceToAll}
                      >
                        Aplicar Valores a Todas
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="space-y-2">
                              <Label>Referência</Label>
                              <Input
                                value={variant.referencia}
                                onChange={(e) => handleVariantChange(index, 'referencia', e.target.value)}
                                placeholder="REF001"
                                className="min-w-0 w-full font-mono text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Cor</Label>
                              <Input
                                value={variant.cor}
                                onChange={(e) => handleVariantChange(index, 'cor', e.target.value)}
                                placeholder="Cor"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Tamanho</Label>
                              <Input
                                value={variant.tamanho}
                                onChange={(e) => handleVariantChange(index, 'tamanho', e.target.value)}
                                placeholder="Tamanho"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Preço de Venda (€)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={variant.preco_venda}
                                onChange={(e) => handleVariantChange(index, 'preco_venda', e.target.value)}
                                placeholder="0.00"
                              />
                            </div>

                            {isOwner && (
                              <div className="space-y-2">
                                <Label className="text-amber-600">Impostos (%)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={variant.impostos_percentual || 0}
                                  onChange={(e) => handleVariantChange(index, 'impostos_percentual', e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Estoque Loja</Label>
                              <Input
                                type="number"
                                value={variant.quantidade_loja}
                                onChange={(e) => handleVariantChange(index, 'quantidade_loja', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Estoque</Label>
                              <Input
                                type="number"
                                value={variant.quantidade_estoque}
                                onChange={(e) => handleVariantChange(index, 'quantidade_estoque', e.target.value)}
                                placeholder="0"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Local Loja</Label>
                              <Input
                                value={variant.local_loja}
                                onChange={(e) => handleVariantChange(index, 'local_loja', e.target.value)}
                                placeholder="A1, B2..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Local Estoque</Label>
                              <Input
                                value={variant.local_estoque}
                                onChange={(e) => handleVariantChange(index, 'local_estoque', e.target.value)}
                                placeholder="E1, E2..."
                              />
                            </div>
                          </div>

                          {/* Image uploads */}
                          <div className="space-y-2">
                            <Label>Imagens da Variante (máx. 4)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[1, 2, 3, 4].map((imageIndex) => (
                                <div key={imageIndex} className="space-y-2">
                                  <Label className="text-xs">Foto {imageIndex}</Label>
                                  <div className="relative">
                                    {variant[`foto_url_${imageIndex}` as keyof typeof variant] ? (
                                      <div className="relative group">
                                        <img
                                          src={variant[`foto_url_${imageIndex}` as keyof typeof variant] as string}
                                          alt={`Foto ${imageIndex}`}
                                          className="w-full h-20 object-cover rounded border"
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => handleVariantChange(index, `foto_url_${imageIndex}`, '')}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-muted-foreground/25 rounded cursor-pointer hover:border-muted-foreground/50">
                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground mt-1">Upload</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleImageUpload(index, e.target.files, imageIndex)}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div>
                {currentStep > 1 && !isEditing && (
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}
              </div>

              <Button onClick={handleSubmit} disabled={submitting}>
                {currentStep < 3 ? (
                  <>
                    {currentStep === 1 ? 'Próximo' : 'Gerar Variantes'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  isEditing ? 'Salvar Alterações' : 'Criar Produto'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ProductConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleFinalSubmit}
        productData={productData}
        variants={variants}
        loading={submitting}
      />
    </>
  );
};
