import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from './PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

interface EmailPasswordFormProps {
  type: 'login' | 'signup';
  onSignupSuccess?: () => void;
}

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export const EmailPasswordForm = ({ type, onSignupSuccess }: EmailPasswordFormProps) => {
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const schema = type === 'login' ? loginSchema : signupSchema;
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: type === 'login' 
      ? { email: '', password: '' }
      : { fullName: '', email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData | SignupFormData) => {
    setLoading(true);
    
    try {
      if (type === 'login') {
        const { email, password } = data as LoginFormData;
        await signIn(email, password);
      } else {
        const { fullName, email, password } = data as SignupFormData;
        const result = await signUp(email, password, fullName);
        
        // Se cadastro foi bem-sucedido, limpa o formulário e troca para a aba de login
        if (result.success && !result.error) {
          form.reset();
          onSignupSuccess?.();
        }
      }
    } catch (error) {
      console.error(`${type} error:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {type === 'signup' && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Nome Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                       <Input
                        placeholder="Seu nome completo"
                        className="pl-10 glass-card border-border/50 focus:border-ring h-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10 glass-card border-border/50 focus:border-ring h-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Senha</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={type === 'login' ? 'Sua senha' : 'Crie uma senha'}
                    className="glass-card border-border/50 focus:border-ring h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button
              type="submit"
              size="default"
              disabled={loading}
              className="w-full mt-4"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading 
                ? (type === 'login' ? 'Entrando...' : 'Cadastrando...') 
                : (type === 'login' ? 'Entrar' : 'Criar Conta')
              }
            </Button>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  );
};