import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Definindo um tipo para o perfil do nosso funcionário
type EmployeeProfile = Database['public']['Tables']['employees']['Row'];

interface AuthContextType {
  user: User | null;
  employee: EmployeeProfile | null; // Adicionado o perfil do funcionário ao contexto
  session: Session | null;
  loading: boolean;
  isAdmin: boolean; // Adicionado para simplificar verificações de permissão
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null); // Estado para o perfil do funcionário
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (initialSession?.user) {
          const { data: employeeProfile } = await supabase
            .from('employees')
            .select('*')
            .eq('id', initialSession.user.id)
            .is('deleted_at', null)
            .single();

          setUser(initialSession.user);
          setSession(initialSession);
          setEmployee(employeeProfile);
        }
      } catch (error) {
        console.error("Erro ao buscar sessão inicial e perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setLoading(true);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        setSession(newSession);

        if (currentUser) {
          const { data: employeeProfile } = await supabase
            .from('employees')
            .select('*')
            .eq('id', currentUser.id)
            .is('deleted_at', null)
            .single();
          
          setEmployee(employeeProfile);

          if (event === 'SIGNED_IN' && employeeProfile) {
             if (employeeProfile.status === 'pendente' || employeeProfile.status === 'bloqueado') {
              const title = employeeProfile.status === 'pendente' ? "Acesso Pendente" : "Acesso Bloqueado";
              const description = employeeProfile.status === 'pendente'
                ? "Sua conta aguarda aprovação."
                : "Sua conta foi bloqueada.";
              
              toast({ variant: "destructive", title, description });
              await supabase.auth.signOut();
            } else {
               toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
            }
          }
        } else {
          setEmployee(null);
           if (event === 'SIGNED_OUT') {
            toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso." });
          }
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const signUp = async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({ variant: "destructive", title: "Erro no cadastro", description: error.message });
        return { error };
      }
      
      toast({ title: "Cadastro realizado!", description: "Seu acesso está pendente de aprovação." });
      return { error: null, success: true };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: "destructive", title: "Erro no login", description: "Email ou senha incorretos." });
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
     if (error) {
        toast({ variant: "destructive", title: "Erro com Google", description: error.message });
      }
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: "destructive", title: "Erro no logout", description: error.message });
    }
  };
  
  const isAdmin = useMemo(() => ['proprietario', 'gerente'].includes(employee?.role || ''), [employee]);

  const value = useMemo(() => ({
    user,
    employee,
    session,
    loading,
    isAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  }), [user, employee, session, loading, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
