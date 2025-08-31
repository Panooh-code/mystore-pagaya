import { motion } from "framer-motion"
import { Plus, TrendingUp, Package, CreditCard, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const stats = [
    { name: "Vendas Hoje", value: "R$ 2.847", icon: TrendingUp, trend: "+12%" },
    { name: "Produtos", value: "234", icon: Package, trend: "+3" },
    { name: "Transações", value: "28", icon: CreditCard, trend: "+5" },
    { name: "Clientes", value: "156", icon: Users, trend: "+8" },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-2">Bem-vindo à Pagaya</h2>
        <p className="text-muted-foreground">
          Acompanhe o desempenho da sua loja em tempo real
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <stat.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-green-600">
                    {stat.trend}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full button-large bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Novo Produto
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="glass touch-target"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
            <Button 
              variant="outline"
              className="glass touch-target"
            >
              <Package className="h-4 w-4 mr-2" />
              Estoque
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "Produto adicionado: Camiseta Surf",
              "Venda realizada: R$ 89,90",
              "Estoque atualizado: Bermuda Premium"
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-xl bg-muted/30">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-sm">{activity}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}