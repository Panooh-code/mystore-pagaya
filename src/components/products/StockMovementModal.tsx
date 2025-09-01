import React, { useState } from 'react';
import { Package, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from '@/hooks/useProducts';
import { useStockMovements } from '@/hooks/useStockMovements';
import { toast } from '@/hooks/use-toast';

interface StockMovementModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({ product, isOpen, onClose }) => {
  const { createMovement } = useStockMovements();
  const [selectedVariant, setSelectedVariant] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'transferencia' | 'perda' | 'venda'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedVariantData = product.variants?.find(v => v.id === selectedVariant);

  const handleSubmit = async () => {
    if (!selectedVariant || !quantidade) {
      toast({ title: "Erro", description: "Selecione uma variante e quantidade", variant: "destructive" });
      return;
    }

    const qty = parseInt(quantidade);
    if (qty <= 0) {
      toast({ title: "Erro", description: "Quantidade deve ser maior que zero", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      const success = await createMovement({
        variant_id: selectedVariant,
        tipo,
        quantidade: qty,
        origem: origem || undefined,
        destino: destino || undefined,
        observacoes: observacoes || undefined
      });

      if (success) {
        onClose();
        // Reset form
        setSelectedVariant('');
        setTipo('entrada');
        setQuantidade('');
        setOrigem('');
        setDestino('');
        setObservacoes('');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      entrada: 'Entrada',
      saida: 'Saída',
      transferencia: 'Transferência',
      perda: 'Perda',
      venda: 'Venda'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const shouldShowOrigem = ['saida', 'transferencia', 'perda', 'venda'].includes(tipo);
  const shouldShowDestino = ['entrada', 'transferencia'].includes(tipo);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Movimentação de Estoque - {product.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variant Selection */}
          <div>
            <Label htmlFor="variant">Selecione a Variante *</Label>
            <Select value={selectedVariant} onValueChange={setSelectedVariant}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma variante" />
              </SelectTrigger>
              <SelectContent>
                {product.variants?.map(variant => (
                  <SelectItem key={variant.id} value={variant.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {variant.referencia}
                      </Badge>
                      <span>
                        {variant.cor && `${variant.cor}`}
                        {variant.cor && variant.tamanho && ' • '}
                        {variant.tamanho && variant.tamanho}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Stock Info */}
          {selectedVariantData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estoque Atual</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Loja</div>
                  <Badge variant={selectedVariantData.quantidade_loja > 0 ? 'default' : 'destructive'}>
                    {selectedVariantData.quantidade_loja}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Estoque</div>
                  <Badge variant={selectedVariantData.quantidade_estoque > 0 ? 'default' : 'destructive'}>
                    {selectedVariantData.quantidade_estoque}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Movement Type */}
          <div>
            <Label htmlFor="tipo">Tipo de Movimentação *</Label>
            <Select value={tipo} onValueChange={(value: any) => setTipo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="perda">Perda</SelectItem>
                <SelectItem value="venda">Venda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Informe a quantidade"
            />
          </div>

          {/* Origin and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shouldShowOrigem && (
              <div>
                <Label htmlFor="origem">Origem *</Label>
                <Select value={origem} onValueChange={setOrigem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loja">Loja</SelectItem>
                    <SelectItem value="estoque">Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {shouldShowDestino && (
              <div>
                <Label htmlFor="destino">Destino *</Label>
                <Select value={destino} onValueChange={setDestino}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loja">Loja</SelectItem>
                    <SelectItem value="estoque">Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Movement Preview */}
          {selectedVariant && quantidade && tipo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumo da Movimentação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{getTipoLabel(tipo)}</div>
                    <div className="text-muted-foreground">{quantidade} unidades</div>
                  </div>
                  
                  {shouldShowOrigem && origem && (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      <div className="text-center">
                        <div className="font-medium">De: {origem}</div>
                      </div>
                    </>
                  )}
                  
                  {shouldShowDestino && destino && (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      <div className="text-center">
                        <div className="font-medium">Para: {destino}</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observations */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a movimentação"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedVariant || !quantidade || loading}
            >
              {loading ? 'Salvando...' : 'Registrar Movimentação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};