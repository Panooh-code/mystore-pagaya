import { ReactNode } from "react"
import { motion } from "framer-motion"
import { BottomNavigation } from "./bottom-navigation"
import { ThemeToggle } from "./theme-toggle"

interface LayoutProps {
  children: ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
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