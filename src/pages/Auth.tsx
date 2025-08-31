import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/auth/AuthForm';
import { ThemeToggle } from '@/components/theme-toggle';

const Auth = () => {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 rounded-2xl"
        >
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6"
            >
              <span className="text-2xl font-bold text-primary-foreground">MS</span>
            </motion.div>
            
            <h1 className="text-3xl font-bold text-foreground">MyStore</h1>
            <p className="text-muted-foreground text-sm">
              Sistema de gestão para sua loja
            </p>
          </div>

          {/* Auth Form */}
          <AuthForm />
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;