import { supabase } from '@/integrations/supabase/client';

type TableName = 'products' | 'product_variants' | 'suppliers' | 'employees' | 'stock_movements';

/**
 * Helper function para realizar soft delete
 */
export const softDelete = async (
  table: TableName, 
  recordId: string, 
  deletedBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from(table)
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy 
      })
      .eq('id', recordId)
      .is('deleted_at', null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Helper function para restaurar um registro soft-deleted
 */
export const restoreDeleted = async (
  table: TableName, 
  recordId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from(table)
      .update({ 
        deleted_at: null,
        deleted_by: null 
      })
      .eq('id', recordId)
      .not('deleted_at', 'is', null);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Helper function para buscar registros incluindo os soft-deleted (para admin)
 */
export const fetchWithDeleted = async (
  table: TableName, 
  columns: string = '*'
) => {
  return await supabase
    .from(table)
    .select(columns);
};

/**
 * Helper function para buscar apenas registros soft-deleted (para admin)
 */
export const fetchOnlyDeleted = async (
  table: TableName, 
  columns: string = '*'
) => {
  return await supabase
    .from(table)
    .select(columns)
    .not('deleted_at', 'is', null);
};