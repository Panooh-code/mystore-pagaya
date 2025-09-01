import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployee } from './useEmployee';
import { useToast } from '@/hooks/use-toast';

export interface Employee {
  id: string;
  user_id: string;
  nome_completo: string;
  email: string;
  role: 'proprietario' | 'gerente' | 'vendedor';
  status: 'ativo' | 'pendente' | 'bloqueado';
  created_at: string;
  updated_at: string;
}

export const useEmployeeManagement = () => {
  const { user } = useAuth();
  const { employee: currentEmployee } = useEmployee();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    if (!user) {
      console.log('useEmployeeManagement: No user found');
      setLoading(false);
      return;
    }

    console.log('useEmployeeManagement: Fetching employees for user:', user.email);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('useEmployeeManagement: Query result:', { data, error });

      if (error) {
        console.error('Error fetching employees:', error);
        setError(`Erro ao carregar funcionários: ${error.message}`);
        toast({
          title: "Erro ao carregar funcionários",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('useEmployeeManagement: Successfully fetched employees:', data?.length);
        setEmployees(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      const errorMessage = 'Erro inesperado ao buscar funcionários';
      setError(errorMessage);
      toast({
        title: "Erro inesperado",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();

    // Set up real-time subscription
    const channel = supabase
      .channel('employee-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees'
        },
        () => {
          fetchEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateEmployeeRole = async (employeeId: string, newRole: Employee['role']) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ role: newRole })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Cargo atualizado",
        description: `Cargo alterado para ${newRole} com sucesso.`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cargo",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateEmployeeStatus = async (employeeId: string, newStatus: Employee['status']) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ status: newStatus })
        .eq('id', employeeId);

      if (error) throw error;

      const statusText = {
        'ativo': 'aprovado',
        'bloqueado': 'bloqueado',
        'pendente': 'pendente'
      }[newStatus];

      toast({
        title: "Status atualizado",
        description: `Usuário ${statusText} com sucesso.`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: "Usuário removido do sistema com sucesso.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const canManageEmployee = (targetEmployee: Employee) => {
    if (!currentEmployee) return false;
    
    // Não pode gerenciar a si mesmo
    if (targetEmployee.user_id === user?.id) return false;

    // Proprietário pode gerenciar todos
    if (currentEmployee.role === 'proprietario') return true;

    // info@panooh.com pode gerenciar todos
    if (user?.email === 'info@panooh.com') return true;

    // Gerente só pode gerenciar vendedores
    if (currentEmployee.role === 'gerente' && targetEmployee.role === 'vendedor') return true;

    return false;
  };

  const getAvailableActions = (targetEmployee: Employee) => {
    if (!canManageEmployee(targetEmployee)) return [];

    const actions = [];

    // Proprietário tem todas as ações
    if (currentEmployee?.role === 'proprietario' || user?.email === 'info@panooh.com') {
      if (targetEmployee.status === 'pendente') {
        actions.push('aprovar');
      }
      if (targetEmployee.status === 'ativo') {
        actions.push('bloquear');
      }
      if (targetEmployee.status === 'bloqueado') {
        actions.push('aprovar');
      }
      
      actions.push('tornar-proprietario', 'tornar-gerente', 'tornar-vendedor', 'excluir');
    }
    
    // Gerente só pode aprovar/bloquear vendedores
    else if (currentEmployee?.role === 'gerente' && targetEmployee.role === 'vendedor') {
      if (targetEmployee.status === 'pendente') {
        actions.push('aprovar');
      }
      if (targetEmployee.status === 'ativo') {
        actions.push('bloquear');
      }
      if (targetEmployee.status === 'bloqueado') {
        actions.push('aprovar');
      }
    }

    return actions;
  };

  return {
    employees,
    loading,
    error,
    updateEmployeeRole,
    updateEmployeeStatus,
    deleteEmployee,
    canManageEmployee,
    getAvailableActions,
    refetch: fetchEmployees,
  };
};