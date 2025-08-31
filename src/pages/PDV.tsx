import { Layout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PDV() {
  return (
    <Layout title="Ponto de Venda">
      <div className="space-y-6">
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-xl">PDV - Ponto de Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Interface do ponto de venda será implementada aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}