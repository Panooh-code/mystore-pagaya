import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier } from '@/hooks/useSuppliers';

interface SupplierModalProps {
  supplier?: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: any) => Promise<{ error: any }>;
  loading?: boolean;
}

const REGIMES = [
  { value: 'consignacao', label: 'Consignação' },
  { value: 'venda_direta', label: 'Venda Direta' },
  { value: 'ambos', label: 'Ambos' }
];

export const SupplierModal: React.FC<SupplierModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    contato: '',
    telefone: '',
    email: '',
    endereco: '',
    regime: '',
    dados_bancarios: '',
    observacoes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens/closes or supplier changes
  useEffect(() => {
    if (supplier) {
      setFormData({
        nome: supplier.nome || '',
        contato: supplier.contato || '',
        telefone: supplier.telefone || '',
        email: supplier.email || '',
        endereco: supplier.endereco || '',
        regime: extractRegimeFromObservacoes(supplier.observacoes || '') || '',
        dados_bancarios: extractDadosBancariosFromObservacoes(supplier.observacoes || '') || '',
        observacoes: cleanObservacoes(supplier.observacoes || '') || ''
      });
    } else {
      setFormData({
        nome: '',
        contato: '',
        telefone: '',
        email: '',
        endereco: '',
        regime: '',
        dados_bancarios: '',
        observacoes: ''
      });
    }
  }, [supplier, isOpen]);

  // Helper functions to handle observacoes field structure
  const extractRegimeFromObservacoes = (observacoes: string) => {
    const match = observacoes.match(/REGIME:\s*([^|]+)/);
    return match ? match[1].trim() : '';
  };

  const extractDadosBancariosFromObservacoes = (observacoes: string) => {
    const match = observacoes.match(/DADOS_BANCARIOS:\s*([^|]+)/);
    return match ? match[1].trim() : '';
  };

  const cleanObservacoes = (observacoes: string) => {
    return observacoes
      .replace(/REGIME:\s*[^|]+\|?/g, '')
      .replace(/DADOS_BANCARIOS:\s*[^|]+\|?/g, '')
      .replace(/^\|+|\|+$/g, '') // Remove leading/trailing pipes
      .trim();
  };

  const buildObservacoes = () => {
    const parts = [];
    
    if (formData.regime) {
      parts.push(`REGIME: ${formData.regime}`);
    }
    
    if (formData.dados_bancarios) {
      parts.push(`DADOS_BANCARIOS: ${formData.dados_bancarios}`);
    }
    
    if (formData.observacoes) {
      parts.push(formData.observacoes);
    }
    
    return parts.join(' | ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      return;
    }

    setSubmitting(true);

    const supplierData = {
      nome: formData.nome.trim(),
      contato: formData.contato.trim() || null,
      telefone: formData.telefone.trim() || null,
      email: formData.email.trim() || null,
      endereco: formData.endereco.trim() || null,
      observacoes: buildObservacoes() || null
    };

    const result = await onSave(supplierData);
    
    if (!result.error) {
      onClose();
    }
    
    setSubmitting(false);
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isEdit = !!supplier;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do Fornecedor */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome do Fornecedor *
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={handleInputChange('nome')}
              placeholder="Digite o nome do fornecedor"
              required
            />
          </div>

          {/* Row 1: Contato e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contato" className="text-sm font-medium">
                Contato
              </Label>
              <Input
                id="contato"
                value={formData.contato}
                onChange={handleInputChange('contato')}
                placeholder="Nome do contato"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm font-medium">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={handleInputChange('telefone')}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Row 2: Email e Regime */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regime" className="text-sm font-medium">
                Regime
              </Label>
              <Select value={formData.regime} onValueChange={handleSelectChange('regime')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  {REGIMES.map((regime) => (
                    <SelectItem key={regime.value} value={regime.value}>
                      {regime.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="endereco" className="text-sm font-medium">
              Endereço
            </Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={handleInputChange('endereco')}
              placeholder="Endereço completo"
            />
          </div>

          {/* Dados Bancários */}
          <div className="space-y-2">
            <Label htmlFor="dados_bancarios" className="text-sm font-medium">
              Dados Bancários
            </Label>
            <Textarea
              id="dados_bancarios"
              value={formData.dados_bancarios}
              onChange={handleInputChange('dados_bancarios')}
              placeholder="Banco, agência, conta, etc."
              rows={3}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-medium">
              + Infos / Observações
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={handleInputChange('observacoes')}
              placeholder="Informações adicionais sobre o fornecedor"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formData.nome.trim()}
            >
              {submitting ? (isEdit ? 'Salvando...' : 'Criando...') : (isEdit ? 'Salvar' : 'Criar Fornecedor')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};