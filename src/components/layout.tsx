import { ReactNode } from "react"
import { motion } from "framer-motion"
import { useLocation } from "react-router-dom"
import { BottomNavigation } from "./bottom-navigation"
import { ThemeToggle } from "./theme-toggle"

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
          <ThemeToggle />
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