import { motion } from "framer-motion"
import { TrendingUp, Package, CreditCard, ShoppingCart, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useEmployee } from "@/hooks/useEmployee"
import { useDashboardKPIs } from "@/hooks/useDashboardKPIs"
import { useRecentActivities } from "@/hooks/useRecentActivities"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function Dashboard() {
  const { employee } = useEmployee()
  const { kpis, loading: kpisLoading } = useDashboardKPIs()
  const { activities, loading: activitiesLoading } = useRecentActivities()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const stats = [
    { 
      name: "Vendas no Mês", 
      value: kpisLoading ? null : formatCurrency(kpis.salesMonth), 
      icon: TrendingUp 
    },
    { 
      name: "Vendas no Dia", 
      value: kpisLoading ? null : formatCurrency(kpis.salesToday), 
      icon: CreditCard 
    },
    { 
      name: "Transações no Dia", 
      value: kpisLoading ? null : kpis.transactionsToday.toString(), 
      icon: ShoppingCart 
    },
    { 
      name: "Produtos em Estoque", 
      value: kpisLoading ? null : kpis.productsInStock.toString(), 
      icon: Package 
    },
  ]

  const isAdmin = employee?.role === 'proprietario' || employee?.role === 'gerente'

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo à Pagaya - Ericeira</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho da loja</p>
      </div>

      {/* Shortcut Buttons */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/pdv">
            <Button className="w-full h-16 glass-card" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Nova Venda
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/produtos">
              <Button className="w-full h-16 glass-card" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Novo Produto
              </Button>
            </Link>
          )}
          <Link to="/produtos">
            <Button className="w-full h-16 glass-card" variant="outline" size="lg">
              <Package className="h-5 w-5 mr-2" />
              Ver Estoque
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-2">
                  {stat.value ? (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  ) : (
                    <Skeleton className="h-8 w-20" />
                  )}
                  <p className="text-xs text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activities */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-xl bg-muted/30">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <p className="text-sm flex-1">{activity.description}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma atividade recente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}