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
}

export const useEmployee = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user) {
        setEmployee(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching employee:', error);
          setError(error.message);
        } else {
          setEmployee(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
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

  return {
    employee,
    loading,
    error,
    isActive,
    isAdmin,
    isPending,
  };
};