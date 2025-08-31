import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Funcionarios() {
  return (
    <div className="space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-xl">Gestão de Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Página de gestão de funcionários será implementada aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}