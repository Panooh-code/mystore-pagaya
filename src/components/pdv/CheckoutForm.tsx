import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ShoppingCart, RotateCcw } from 'lucide-react';
import { useEmployee } from '@/hooks/useEmployee';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Employee } from '@/hooks/useEmployee';

interface CheckoutFormProps {
  subtotalAmount: number;
  desconto: number;
  onDescontoChange: (desconto: number) => void;
  numeroFatura: string;
  onNumeroFaturaChange: (numero: string) => void;
  vendedorId: string;
  onVendedorChange: (vendedorId: string) => void;
  total: number;
  onRegistrarVenda: () => void;
  onRegistrarDevolucao: () => void;
  isEmpty: boolean;
  loading?: boolean;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  subtotalAmount,
  desconto,
  onDescontoChange,
  numeroFatura,
  onNumeroFaturaChange,
  vendedorId,
  onVendedorChange,
  total,
  onRegistrarVenda,
  onRegistrarDevolucao,
  isEmpty,
  loading = false
}) => {
  const { employee } = useEmployee();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  // Carregar lista de funcionários
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('status', 'ativo')
          .is('deleted_at', null)
          .order('nome_completo');

        if (error) throw error;
        setEmployees(data || []);
        
        // Selecionar o funcionário atual por padrão
        if (employee && !vendedorId) {
          onVendedorChange(employee.id);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, [employee, vendedorId, onVendedorChange]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleDescontoChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(0, Math.min(100, numValue));
    onDescontoChange(clampedValue);
  };

  const isFormValid = numeroFatura.trim().length > 0 && vendedorId && !isEmpty;

  return (
    <Card className="glass-card border-0 h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Finalizar Venda</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Número da Fatura */}
        <div className="space-y-2">
          <Label htmlFor="numeroFatura" className="text-sm font-medium">
            Número da Fatura *
          </Label>
          <Input
            id="numeroFatura"
            value={numeroFatura}
            onChange={(e) => onNumeroFaturaChange(e.target.value)}
            placeholder="Digite o número da fatura"
            className="glass-card border-0"
          />
        </div>

        {/* Desconto */}
        <div className="space-y-2">
          <Label htmlFor="desconto" className="text-sm font-medium">
            Desconto (%)
          </Label>
          <Input
            id="desconto"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={desconto || ''}
            onChange={(e) => handleDescontoChange(e.target.value)}
            placeholder="0"
            className="glass-card border-0"
          />
        </div>

        {/* Vendedor */}
        <div className="space-y-2">
          <Label htmlFor="vendedor" className="text-sm font-medium">
            Vendedor *
          </Label>
          <Select
            value={vendedorId}
            onValueChange={onVendedorChange}
            disabled={employeesLoading}
          >
            <SelectTrigger className="glass-card border-0">
              <SelectValue placeholder="Selecione o vendedor" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.nome_completo}
                  {emp.id === employee?.id && ' (Você)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resumo dos Valores */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>{formatPrice(subtotalAmount)}</span>
          </div>
          
          {desconto > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Desconto ({desconto}%):</span>
              <span className="text-destructive">
                -{formatPrice((subtotalAmount * desconto) / 100)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-semibold border-t pt-3">
            <span>Total:</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={onRegistrarVenda}
            disabled={!isFormValid || loading}
            className="w-full text-lg py-6 font-bold"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {loading ? 'Processando...' : 'Registrar Venda'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onRegistrarDevolucao}
            disabled={loading}
            className="w-full text-lg py-6 font-bold"
            size="lg"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Registrar Devolução/Troca
          </Button>
        </div>

        {isEmpty && (
          <p className="text-xs text-muted-foreground text-center">
            Adicione produtos ao carrinho para finalizar a venda
          </p>
        )}
      </CardContent>
    </Card>
  );
};