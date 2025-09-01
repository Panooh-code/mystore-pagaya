export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string
          id: string
          nome_completo: string
          role: Database["public"]["Enums"]["employee_role"]
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          id?: string
          nome_completo: string
          role?: Database["public"]["Enums"]["employee_role"]
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          id?: string
          nome_completo?: string
          role?: Database["public"]["Enums"]["employee_role"]
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          cor: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          foto_url_1: string | null
          foto_url_2: string | null
          foto_url_3: string | null
          foto_url_4: string | null
          id: string
          impostos_percentual: number | null
          local_estoque: string | null
          local_loja: string | null
          preco_venda: number | null
          product_id: string
          quantidade_estoque: number | null
          quantidade_loja: number | null
          referencia: string
          tamanho: string | null
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          foto_url_1?: string | null
          foto_url_2?: string | null
          foto_url_3?: string | null
          foto_url_4?: string | null
          id?: string
          impostos_percentual?: number | null
          local_estoque?: string | null
          local_loja?: string | null
          preco_venda?: number | null
          product_id: string
          quantidade_estoque?: number | null
          quantidade_loja?: number | null
          referencia: string
          tamanho?: string | null
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          foto_url_1?: string | null
          foto_url_2?: string | null
          foto_url_3?: string | null
          foto_url_4?: string | null
          id?: string
          impostos_percentual?: number | null
          local_estoque?: string | null
          local_loja?: string | null
          preco_venda?: number | null
          product_id?: string
          quantidade_estoque?: number | null
          quantidade_loja?: number | null
          referencia?: string
          tamanho?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          categoria: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          fornecedor_id: string | null
          id: string
          impostos_percentual: number | null
          is_consignado: boolean | null
          modelo: string | null
          nome: string
          observacoes: string | null
          updated_at: string
          valor_custo: number | null
        }
        Insert: {
          categoria: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          fornecedor_id?: string | null
          id?: string
          impostos_percentual?: number | null
          is_consignado?: boolean | null
          modelo?: string | null
          nome: string
          observacoes?: string | null
          updated_at?: string
          valor_custo?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          fornecedor_id?: string | null
          id?: string
          impostos_percentual?: number | null
          is_consignado?: boolean | null
          modelo?: string | null
          nome?: string
          observacoes?: string | null
          updated_at?: string
          valor_custo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          destino: string | null
          employee_id: string
          id: string
          observacoes: string | null
          origem: string | null
          quantidade: number
          tipo: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          destino?: string | null
          employee_id: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          quantidade: number
          tipo: string
          variant_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          destino?: string | null
          employee_id?: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          quantidade?: number
          tipo?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contato: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          contato?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          contato?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pending_employees_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      restore_deleted: {
        Args: { record_id: string; table_name: string }
        Returns: undefined
      }
      soft_delete: {
        Args: { deleted_by_user: string; record_id: string; table_name: string }
        Returns: undefined
      }
    }
    Enums: {
      employee_role: "proprietario" | "gerente" | "vendedor"
      employee_status: "ativo" | "pendente" | "bloqueado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      employee_role: ["proprietario", "gerente", "vendedor"],
      employee_status: ["ativo", "pendente", "bloqueado"],
    },
  },
} as const
