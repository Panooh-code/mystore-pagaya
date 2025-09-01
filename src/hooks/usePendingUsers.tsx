import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePendingUsers = () => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!user) {
        setPendingCount(0);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_pending_employees_count');
        
        if (error) {
          console.error('Error fetching pending users count:', error);
          setError(error.message);
        } else {
          setPendingCount(data || 0);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Erro inesperado ao buscar usuários pendentes');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCount();

    // Set up real-time subscription for employee changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees'
        },
        () => {
          // Refetch count when employees table changes
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    pendingCount,
    loading,
    error,
  };
};