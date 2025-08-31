import { Layout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Fornecedores() {
  return (
    <Layout title="Fornecedores">
      <div className="space-y-6">
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-xl">Gestão de Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Página de gestão de fornecedores será implementada aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}