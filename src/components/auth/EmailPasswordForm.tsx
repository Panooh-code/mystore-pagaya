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
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos 1 letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número'),
});

interface EmailPasswordFormProps {
  type: 'login' | 'signup';
}

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export const EmailPasswordForm = ({ type }: EmailPasswordFormProps) => {
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
        await signUp(email, password, fullName);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        className="pl-10 glass-card border-border/50 focus:border-ring h-12"
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
                      className="pl-10 glass-card border-border/50 focus:border-ring h-12"
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
                    placeholder={type === 'login' ? 'Sua senha' : 'Crie uma senha forte'}
                    className="glass-card border-border/50 focus:border-ring h-12"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
                {type === 'signup' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
                  </p>
                )}
              </FormItem>
            )}
          />

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full button-large mt-6"
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