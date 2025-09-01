import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface DashboardKPIs {
  salesMonth: number
  salesToday: number
  transactionsToday: number
  productsInStock: number
}

export function useDashboardKPIs() {
  const [kpis, setKpis] = useState<DashboardKPIs>({
    salesMonth: 0,
    salesToday: 0,
    transactionsToday: 0,
    productsInStock: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKPIs = async () => {
    try {
      setError(null)
      
      // Get current date info
      const today = new Date()
      const currentMonth = today.getMonth() + 1
      const currentYear = today.getFullYear()
      const todayStr = today.toISOString().split('T')[0]

      // Fetch sales for current month
      const { data: monthSales, error: monthError } = await supabase
        .from('sales')
        .select('total_venda')
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)
        .is('deleted_at', null)

      if (monthError) throw monthError

      // Fetch sales for today
      const { data: todaySales, error: todayError } = await supabase
        .from('sales')
        .select('total_venda')
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${todayStr}T23:59:59`)
        .is('deleted_at', null)

      if (todayError) throw todayError

      // Fetch transaction count for today
      const { count: transactionsCount, error: transactionsError } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${todayStr}T23:59:59`)
        .is('deleted_at', null)

      if (transactionsError) throw transactionsError

      // Fetch products in stock
      const { data: stockData, error: stockError } = await supabase
        .from('product_variants')
        .select('quantidade_loja, quantidade_estoque')
        .is('deleted_at', null)

      if (stockError) throw stockError

      // Calculate totals
      const salesMonthTotal = monthSales?.reduce((sum, sale) => sum + (sale.total_venda || 0), 0) || 0
      const salesTodayTotal = todaySales?.reduce((sum, sale) => sum + (sale.total_venda || 0), 0) || 0
      const stockTotal = stockData?.reduce((sum, variant) => 
        sum + (variant.quantidade_loja || 0) + (variant.quantidade_estoque || 0), 0) || 0

      setKpis({
        salesMonth: salesMonthTotal,
        salesToday: salesTodayTotal,
        transactionsToday: transactionsCount || 0,
        productsInStock: stockTotal
      })
    } catch (err) {
      console.error('Error fetching KPIs:', err)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKPIs()
    
    // Update KPIs every 5 minutes
    const interval = setInterval(fetchKPIs, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return { kpis, loading, error, refetch: fetchKPIs }
}