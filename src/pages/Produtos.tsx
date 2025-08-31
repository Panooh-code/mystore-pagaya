import { Layout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Produtos() {
  return (
    <Layout title="Produtos">
      <div className="space-y-6">
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-xl">Gestão de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Página de gestão de produtos será implementada aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}