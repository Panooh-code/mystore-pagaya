import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface Activity {
  id: string
  type: 'product' | 'sale'
  description: string
  created_at: string
}

export function useRecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async () => {
    try {
      setError(null)
      
      // Fetch recent products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nome, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (productsError) throw productsError

      // Fetch recent sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, fatura_numero, total_venda, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (salesError) throw salesError

      // Combine and format activities
      const allActivities: Activity[] = []

      // Add product activities
      products?.forEach(product => {
        allActivities.push({
          id: `product-${product.id}`,
          type: 'product',
          description: `Novo produto adicionado: ${product.nome}`,
          created_at: product.created_at
        })
      })

      // Add sale activities
      sales?.forEach(sale => {
        const value = new Intl.NumberFormat('pt-PT', {
          style: 'currency',
          currency: 'EUR'
        }).format(sale.total_venda || 0)
        
        allActivities.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          description: `Nova venda registrada: ${sale.fatura_numero} - ${value}`,
          created_at: sale.created_at
        })
      })

      // Sort by date and take the 8 most recent
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8)

      setActivities(sortedActivities)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError('Erro ao carregar atividades recentes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    
    // Update activities every 5 minutes
    const interval = setInterval(fetchActivities, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return { activities, loading, error, refetch: fetchActivities }
}