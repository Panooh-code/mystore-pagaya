import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Busca a sessão inicial para verificar se o usuário já está logado
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error("Erro ao buscar sessão inicial:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Ouve por mudanças no estado de autenticação (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Lógica para verificar o status do funcionário antes de confirmar o login
        if (event === 'SIGNED_IN' && newSession?.user) {
          try {
            const { data: employee } = await supabase
              .from('employees')
              .select('status')
              .eq('user_id', newSession.user.id)
              .is('deleted_at', null)
              .single();

            if (employee?.status === 'pendente' || employee?.status === 'bloqueado') {
              const title = employee.status === 'pendente' ? "Acesso Pendente" : "Acesso Bloqueado";
              const description = employee.status === 'pendente'
                ? "Sua conta ainda está aguardando aprovação. Entre em contato com um administrador."
                : "Sua conta foi bloqueada. Entre em contato com um administrador.";
              
              toast({ variant: "destructive", title, description });
              await supabase.auth.signOut(); // Força o logout
              setSession(null);
              setUser(null);
              return; // Interrompe a execução para não logar o usuário
            }

            // Se o usuário for válido, exibe o toast de boas-vindas
            toast({
              title: "Bem-vindo!",
              description: "Login realizado com sucesso.",
            });

          } catch (error) {
            console.error('Erro ao verificar status do funcionário:', error);
            // Mesmo com erro na verificação, desloga por segurança
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            return;
          }
        } else if (event === 'SIGNED_OUT') {
            toast({
              title: "Logout realizado",
              description: "Você foi desconectado com sucesso.",
            });
        }

        // Atualiza o estado da sessão e do usuário
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    // Limpeza ao desmontar o componente
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]); // O useEffect agora depende apenas do `toast` que é estável

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: error.message,
        });
        return { error };
      }

      // Após o cadastro, o onAuthStateChange cuidará de deslogar se o status for pendente.
      // A lógica de forçar logout foi removida daqui para centralizar no listener.
      toast({
        title: "Cadastro realizado!",
        description: "Seu acesso está sendo analisado. Você receberá uma confirmação em breve.",
      });

      return { error: null, success: true };
    } catch (err) {
      console.error('Unexpected signup error:', err);
      return { error: err as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: "Email ou senha incorretos.",
        });
      }
      // A verificação de status pendente/bloqueado agora é tratada centralmente pelo onAuthStateChange
      return { error };
    } catch (err) {
      console.error('Unexpected signin error:', err);
      return { error: err as AuthError };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error('Google signin error:', error);
        toast({
          variant: "destructive",
          title: "Erro no login com Google",
          description: error.message,
        });
      }

      return { error };
    } catch (err) {
      console.error('Unexpected Google signin error:', err);
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        toast({
          variant: "destructive",
          title: "Erro no logout",
          description: error.message,
        });
      }
    } catch (err) {
      console.error('Unexpected signout error:', err);
    }
  };

  // O useMemo garante que o objeto de valor do contexto só seja recriado se os seus conteúdos mudarem.
  // Isso evita re-renderizações desnecessárias nos componentes consumidores.
  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
