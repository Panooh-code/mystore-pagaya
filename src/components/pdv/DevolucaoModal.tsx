import React, { useState } from 'react';
import { Search, Package, ArrowLeft, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSales, VendaCompleta, VendaItem } from '@/hooks/useSales';

interface DevolucaoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemSelecionado extends VendaItem {
  selecionado: boolean;
}

export const DevolucaoModal: React.FC<DevolucaoModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [etapaAtual, setEtapaAtual] = useState<'busca' | 'selecao' | 'confirmacao'>('busca');
  const [faturaNumero, setFaturaNumero] = useState('');
  const [vendaOriginal, setVendaOriginal] = useState<VendaCompleta | null>(null);
  const [itensSelecionados, setItensSelecionados] = useState<ItemSelecionado[]>([]);
  const [tipoOperacao, setTipoOperacao] = useState<'DEVOLUCAO' | 'TROCA'>('DEVOLUCAO');
  const [destinoDevolucao, setDestinoDevolucao] = useState<'LOJA' | 'FORNECEDOR'>('LOJA');

  const { loading, buscarVendaPorFatura, registrarTransacao, convertCartItemsToTransacaoItems } = useSales();

  const handleBuscarVenda = async () => {
    if (!faturaNumero.trim()) return;

    const venda = await buscarVendaPorFatura(faturaNumero.trim());
    if (venda) {
      setVendaOriginal(venda);
      setItensSelecionados(
        venda.itens.map(item => ({
          ...item,
          selecionado: false
        }))
      );
      setEtapaAtual('selecao');
    }
  };

  const handleToggleItem = (itemId: string) => {
    setItensSelecionados(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, selecionado: !item.selecionado }
          : item
      )
    );
  };

  const handleConfirmarDevolucao = async () => {
    if (!vendaOriginal) return;

    const itensParaDevolucao = itensSelecionados.filter(item => item.selecionado);
    if (itensParaDevolucao.length === 0) return;

    // Gerar número da fatura para devolução/troca
    const prefixo = tipoOperacao === 'TROCA' ? 'TRC' : 'DEV';
    const timestamp = Date.now().toString().slice(-6);
    const novaFatura = `${prefixo}-${faturaNumero}-${timestamp}`;

    const payload = {
      fatura_numero: novaFatura,
      desconto_percentual: vendaOriginal.desconto_percentual,
      employee_id: vendaOriginal.employee_id,
      tipo_transacao: tipoOperacao,
      original_sale_id: vendaOriginal.id,
      destino_devolucao: destinoDevolucao,
      itens: itensParaDevolucao.map(item => ({
        variant_id: item.variant_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario
      }))
    };

    const { error } = await registrarTransacao(payload);
    if (!error) {
      onSuccess();
      handleFecharModal();
    }
  };

  const handleFecharModal = () => {
    setEtapaAtual('busca');
    setFaturaNumero('');
    setVendaOriginal(null);
    setItensSelecionados([]);
    setTipoOperacao('DEVOLUCAO');
    setDestinoDevolucao('LOJA');
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const totalSelecionado = itensSelecionados
    .filter(item => item.selecionado)
    .reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);

  return (
    <Dialog open={open} onOpenChange={handleFecharModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {etapaAtual === 'busca' && 'Buscar Venda Original'}
            {etapaAtual === 'selecao' && 'Selecionar Itens para Devolução/Troca'}
            {etapaAtual === 'confirmacao' && 'Confirmar Operação'}
          </DialogTitle>
        </DialogHeader>

        {/* Etapa 1: Busca da Venda */}
        {etapaAtual === 'busca' && (
          <div className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Buscar Venda Original</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Digite o número da fatura..."
                      value={faturaNumero}
                      onChange={(e) => setFaturaNumero(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleBuscarVenda()}
                    />
                  </div>
                  <Button 
                    onClick={handleBuscarVenda}
                    disabled={loading || !faturaNumero.trim()}
                    className="px-6"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Digite o número da fatura da venda original que deseja processar.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Etapa 2: Seleção de Itens */}
        {etapaAtual === 'selecao' && vendaOriginal && (
          <div className="space-y-6">
            {/* Informações da Venda Original */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Venda Original</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEtapaAtual('busca')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium">Fatura</p>
                    <p className="text-lg">{vendaOriginal.fatura_numero}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Vendedor</p>
                    <p>{vendaOriginal.employee.nome_completo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Data</p>
                    <p>{new Date(vendaOriginal.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(vendaOriginal.total_venda)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tipo de Operação */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Tipo de Operação</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={tipoOperacao}
                  onValueChange={(value: 'DEVOLUCAO' | 'TROCA') => setTipoOperacao(value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="DEVOLUCAO" id="devolucao" />
                    <Label htmlFor="devolucao">Devolução</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="TROCA" id="troca" />
                    <Label htmlFor="troca">Troca</Label>
                  </div>
                </RadioGroup>
                
                {tipoOperacao === 'DEVOLUCAO' && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Destino da Devolução</Label>
                    <RadioGroup
                      value={destinoDevolucao}
                      onValueChange={(value: 'LOJA' | 'FORNECEDOR') => setDestinoDevolucao(value)}
                      className="flex gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="LOJA" id="loja" />
                        <Label htmlFor="loja">Devolver ao Estoque da Loja</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="FORNECEDOR" id="fornecedor" />
                        <Label htmlFor="fornecedor">Devolver ao Fornecedor</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de Itens */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Selecionar Itens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {itensSelecionados.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        item.selecionado ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-border'
                      }`}
                    >
                      <Checkbox
                        checked={item.selecionado}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      
                      {item.variant.foto_url_1 && (
                        <img
                          src={item.variant.foto_url_1}
                          alt={item.variant.product.nome}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{item.variant.product.nome}</h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.variant.referencia}
                          </Badge>
                          {item.variant.cor && (
                            <Badge variant="outline" className="text-xs">
                              {item.variant.cor}
                            </Badge>
                          )}
                          {item.variant.tamanho && (
                            <Badge variant="outline" className="text-xs">
                              {item.variant.tamanho}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">Qtd: {item.quantidade}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.preco_unitario)}
                        </p>
                        <p className="font-bold">
                          {formatPrice(item.quantidade * item.preco_unitario)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <p className="text-lg font-medium">
                    Total Selecionado: {formatPrice(totalSelecionado)}
                  </p>
                  <Button
                    onClick={handleConfirmarDevolucao}
                    disabled={loading || itensSelecionados.filter(i => i.selecionado).length === 0}
                    className="px-6"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar {tipoOperacao === 'TROCA' ? 'Troca' : 'Devolução'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};