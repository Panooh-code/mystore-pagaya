import { motion } from "framer-motion"
import { BarChart3, CreditCard, Package, Users, UserCheck } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "PDV", href: "/pdv", icon: CreditCard },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Fornecedores", href: "/fornecedores", icon: Users },
  { name: "Funcionários", href: "/funcionarios", icon: UserCheck },
]

export function BottomNavigation() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-border/20">
      <div className="flex items-center justify-around px-2 py-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center justify-center px-3 py-2 rounded-2xl transition-colors touch-target min-w-16",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-2xl"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }}
                    />
                  )}
                  <Icon 
                    className={cn(
                      "h-6 w-6 mb-1 relative z-10 transition-transform",
                      isActive && "scale-110"
                    )} 
                  />
                  <span className="text-xs font-medium relative z-10">
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}