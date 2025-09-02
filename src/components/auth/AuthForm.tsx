import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { GoogleAuthButton } from './GoogleAuthButton';
import { EmailPasswordForm } from './EmailPasswordForm';

export const AuthForm = () => {
  const [activeTab, setActiveTab] = useState('login');

  const handleSignupSuccess = () => {
    // Troca automaticamente para a aba de login após cadastro bem-sucedido
    setActiveTab('login');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="space-y-6"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full glass">
          <TabsTrigger 
            value="login" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Entrar
          </TabsTrigger>
          <TabsTrigger 
            value="signup"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Cadastrar
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="login" className="space-y-4 m-0">
              <div className="space-y-4">
                <GoogleAuthButton />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Ou continue com
                    </span>
                  </div>
                </div>

                <EmailPasswordForm type="login" />
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 m-0">
              <div className="space-y-4">
                <GoogleAuthButton />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Ou cadastre-se com
                    </span>
                  </div>
                </div>

                <EmailPasswordForm type="signup" onSignupSuccess={handleSignupSuccess} />
              </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
};