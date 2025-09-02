import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
    let authChangeTimeout: NodeJS.Timeout;
    
    // Set up auth state listener with debounce to prevent rapid state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id, new Date().toISOString());
        
        // Clear any pending auth changes
        if (authChangeTimeout) {
          clearTimeout(authChangeTimeout);
        }
        
        // Debounce auth state changes to prevent rapid toggling
        authChangeTimeout = setTimeout(async () => {
          // Check if user has pending status before allowing login
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const { data: employee } = await supabase
                .from('employees')
                .select('status')
                .eq('user_id', session.user.id)
                .is('deleted_at', null)
                .single();

              if (employee?.status === 'pendente') {
                console.log('User with pending status attempted login, forcing logout');
                await supabase.auth.signOut();
                toast({
                  variant: "destructive",
                  title: "Acesso Pendente",
                  description: "Sua conta ainda está aguardando aprovação. Entre em contato com um administrador.",
                });
                return;
              } else if (employee?.status === 'bloqueado') {
                console.log('Blocked user attempted login, forcing logout');
                await supabase.auth.signOut();
                toast({
                  variant: "destructive",
                  title: "Acesso Bloqueado",
                  description: "Sua conta foi bloqueada. Entre em contato com um administrador.",
                });
                return;
              }
            } catch (error) {
              console.error('Error checking employee status:', error);
            }
          }

          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Only show toasts for explicit user actions, not automatic token refreshes
          if (event === 'SIGNED_IN' && session) {
            toast({
              title: "Bem-vindo!",
              description: "Login realizado com sucesso.",
            });
          } else if (event === 'SIGNED_OUT') {
            // Don't show logout toast for automatic session expiry
            const isManualLogout = !document.hidden;
            if (isManualLogout) {
              toast({
                title: "Logout realizado",
                description: "Você foi desconectado com sucesso.",
              });
            }
          }
        }, 100);
      }
    );

    // Check for existing session with retry logic
    const checkSession = async (retryCount = 0) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error && retryCount < 3) {
          console.warn('Session check failed, retrying...', error);
          setTimeout(() => checkSession(retryCount + 1), 1000);
          return;
        }
        
        console.log('Initial session check:', session?.user?.id, new Date().toISOString());
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('Session check error:', err);
        setLoading(false);
      }
    };

    checkSession();

    // Handle visibility change (when app comes back from background)
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('App became visible, refreshing session');
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session && user) {
            console.warn('Session lost while app was in background');
            setSession(null);
            setUser(null);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic session check for mobile reliability
    const sessionCheckInterval = setInterval(async () => {
      if (user && !document.hidden) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.warn('Session expired, logging out user');
            setSession(null);
            setUser(null);
          }
        } catch (err) {
          console.error('Periodic session check failed:', err);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout);
      }
    };
  }, [toast, user]);

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
      } else {
        // Força o logout imediato para evitar login automático
        await supabase.auth.signOut();
        
        toast({
          title: "Cadastro realizado!",
          description: "Seu acesso está sendo analisado. Você receberá uma confirmação em breve.",
        });
        
        return { error: null, success: true };
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      return { error: err as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
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
        return { error };
      }

      // Verificar status do employee após login bem-sucedido
      if (data.user) {
        try {
          const { data: employee } = await supabase
            .from('employees')
            .select('status')
            .eq('user_id', data.user.id)
            .is('deleted_at', null)
            .single();

          if (employee?.status === 'pendente') {
            await supabase.auth.signOut();
            toast({
              variant: "destructive",
              title: "Acesso Pendente",
              description: "Sua conta ainda está aguardando aprovação. Entre em contato com um administrador.",
            });
            return { error: { message: 'Account pending approval' } as AuthError };
          } else if (employee?.status === 'bloqueado') {
            await supabase.auth.signOut();
            toast({
              variant: "destructive",
              title: "Acesso Bloqueado",
              description: "Sua conta foi bloqueada. Entre em contato com um administrador.",
            });
            return { error: { message: 'Account blocked' } as AuthError };
          }
        } catch (employeeError) {
          console.error('Error checking employee status after login:', employeeError);
        }
      }

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

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};