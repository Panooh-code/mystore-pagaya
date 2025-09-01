import { ReactNode } from "react"
import { motion } from "framer-motion"
import { useLocation, Link } from "react-router-dom"
import { BottomNavigation } from "./bottom-navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useEmployee } from "@/hooks/useEmployee"
import { usePendingUsers } from "@/hooks/usePendingUsers"
import { useTheme } from "./theme-provider"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { LogOut, User, UserCog, Users, Moon, Sun } from "lucide-react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "./ui/drawer"

interface LayoutProps {
  children: ReactNode
}

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case "/":
      return "Dashboard"
    case "/pdv":
      return "Ponto de Venda"
    case "/produtos":
      return "Produtos"
    case "/fornecedores":
      return "Fornecedores"
    case "/funcionarios":
      return "Funcionários"
    default:
      return ""
  }
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const title = getPageTitle(location.pathname)
  const { user, signOut } = useAuth()
  const { employee, isAdmin } = useEmployee()
  const { pendingCount } = usePendingUsers()
  const { theme, setTheme } = useTheme()

  const handleLogout = async () => {
    await signOut()
  }

  // Check if user can see Users menu (proprietario or super admin)
  const canManageUsers = isAdmin || user?.email === 'info@panooh.com'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/20">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-primary">MyStore</h1>
            {title && (
              <span className="text-sm text-muted-foreground">• {title}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">            
            {/* User Menu Drawer */}
            <Drawer direction="right">
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="glass">
                  <User className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="glass-card h-full w-80 ml-auto">
                <div className="px-4 py-6 space-y-4">
                  {/* Boas vindas */}
                  <div className="px-2">
                    <p className="text-lg font-medium">
                      Olá, {employee?.nome_completo || user?.email?.split('@')[0]}
                    </p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="space-y-1">
                    {/* Meu Perfil */}
                    <DrawerClose asChild>
                      <Link 
                        to="/perfil" 
                        className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                      >
                        <UserCog className="h-5 w-5" />
                        <span>Meu Perfil</span>
                      </Link>
                    </DrawerClose>
                    
                    {/* Usuários (apenas para admins) */}
                    {canManageUsers && (
                      <DrawerClose asChild>
                        <Link 
                          to="/gerenciamento" 
                          className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Users className="h-5 w-5" />
                            <span>Usuários</span>
                          </div>
                          {pendingCount > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {pendingCount}
                            </Badge>
                          )}
                        </Link>
                      </DrawerClose>
                    )}

                    {/* Theme Toggle */}
                    <button
                      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 w-full text-left"
                    >
                      <div className="relative">
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute top-0 left-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </div>
                      <span>Tema</span>
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 px-4 pt-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}