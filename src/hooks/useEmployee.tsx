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
        console.log('useEmployee: No user found');
        setEmployee(null);
        setLoading(false);
        return;
      }

      console.log('useEmployee: Fetching employee for user:', user.id, user.email);

      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching employee:', error);
          
          // Fallback para o admin principal
          if (user.email === 'info@panooh.com') {
            console.log('useEmployee: Fallback for main admin');
            const { data: adminData, error: adminError } = await supabase
              .from('employees')
              .select('*')
              .eq('email', 'info@panooh.com')
              .single();
            
            if (!adminError && adminData) {
              console.log('useEmployee: Admin fallback successful:', adminData);
              setEmployee(adminData);
            } else {
              setError(error.message);
            }
          } else {
            setError(error.message);
          }
        } else {
          console.log('useEmployee: Employee found:', data);
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

  // Log para debug
  console.log('useEmployee state:', {
    employee: employee ? {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      status: employee.status
    } : null,
    isActive,
    isAdmin,
    isPending,
    loading,
    error
  });

  return {
    employee,
    loading,
    error,
    isActive,
    isAdmin,
    isPending,
  };
};