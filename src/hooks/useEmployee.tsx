import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Employee {
  id: string;
  user_id: string;
  nome_completo: string;
  email: string;
  role: 'proprietario' | 'gerente' | 'vendedor';
  status: 'ativo' | 'pendente' | 'bloqueado';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export const useEmployee = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user) {
        console.log('useEmployee: No user found');
        setEmployee(null);
        setLoading(false);
        return;
      }

      console.log('useEmployee: Fetching employee for user:', user.id, user.email);

      try {
        // Primeiro tenta buscar pelo user_id
        let { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .single();

        // Se não encontrou pelo user_id, tenta pelo email (fallback importante)
        if (error && user.email) {
          console.log('useEmployee: Trying fallback by email for:', user.email);
          const { data: emailData, error: emailError } = await supabase
            .from('employees')
            .select('*')
            .eq('email', user.email)
            .is('deleted_at', null)
            .single();

          if (!emailError && emailData) {
            data = emailData;
            error = null;
            
            // Se o email é info@panooh.com, força proprietário ativo
            if (user.email === 'info@panooh.com') {
              console.log('useEmployee: Main admin detected, ensuring proper status');
              data.role = 'proprietario';
              data.status = 'ativo';
            }
            
            console.log('useEmployee: Found employee by email, updating user_id');
            // Atualiza o user_id no registro para corrigir a associação
            await supabase
              .from('employees')
              .update({ user_id: user.id })
              .eq('id', data.id);
          }
        }

        // Verificação especial para admin principal
        if (user.email === 'info@panooh.com' && (!data || data.role !== 'proprietario')) {
          console.log('useEmployee: Special case for main admin');
          const fallbackEmployee: Employee = {
            id: 'main-admin-fallback',
            user_id: user.id,
            nome_completo: 'Megafoto ADM',
            email: 'info@panooh.com',
            role: 'proprietario',
            status: 'ativo',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          data = fallbackEmployee as any;
          error = null;
        }

        if (error || !data) {
          console.error('Error fetching employee:', error);
          setError(error?.message || 'Funcionário não encontrado');
        } else {
          console.log('useEmployee: Employee found:', data);
          setEmployee(data);
          setError(null);
        }
      } catch (err) {
        console.error('Unexpected error in useEmployee:', err);
        setError('Erro inesperado ao buscar dados do funcionário');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [user]);

  const isActive = employee?.status === 'ativo';
  const isAdmin = employee?.role === 'proprietario' || employee?.role === 'gerente';
  const isPending = employee?.status === 'pendente';

  // Verificação adicional para admin principal (garantia extra)
  const isMainAdmin = user?.email === 'info@panooh.com';
  const finalIsAdmin = isMainAdmin || isAdmin;

  // Log detalhado para debug
  console.log('useEmployee final state:', {
    userEmail: user?.email,
    userId: user?.id,
    employee: employee ? {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      user_id: employee.user_id
    } : null,
    isActive,
    isAdmin,
    isMainAdmin,
    finalIsAdmin,
    isPending,
    loading,
    error
  });

  return {
    employee,
    loading,
    error,
    isActive,
    isAdmin: finalIsAdmin,
    isPending,
  };
};