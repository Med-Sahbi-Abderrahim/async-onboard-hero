import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Tables that support soft-delete via deleted_at column
 */
export const SOFT_DELETABLE_TABLES = [
  'clients',
  'intake_forms',
  'form_submissions',
  'onboarding_checklist_items',
  'automations',
  'logs',
  'templates',
  'organization_members',
  'tasks',
  'meetings',
  'client_files',
  'contracts',
  'invoices',
  'notifications',
] as const;

export type SoftDeletableTable = (typeof SOFT_DELETABLE_TABLES)[number];

/**
 * Performs a soft-delete on a record by setting deleted_at timestamp
 * @param supabase - Supabase client instance
 * @param table - Table name (must be in SOFT_DELETABLE_TABLES)
 * @param id - Record ID to soft-delete
 * @returns Promise with error if any
 */
export async function softDelete(
  supabase: SupabaseClient,
  table: SoftDeletableTable,
  id: string
) {
  if (!SOFT_DELETABLE_TABLES.includes(table)) {
    throw new Error(
      `Table "${table}" is not configured for soft-delete. Add it to SOFT_DELETABLE_TABLES if it has a deleted_at column.`
    );
  }

  return supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
}

/**
 * Performs a soft-delete on multiple records
 * @param supabase - Supabase client instance
 * @param table - Table name
 * @param ids - Array of record IDs to soft-delete
 * @returns Promise with error if any
 */
export async function softDeleteMultiple(
  supabase: SupabaseClient,
  table: SoftDeletableTable,
  ids: string[]
) {
  if (!SOFT_DELETABLE_TABLES.includes(table)) {
    throw new Error(
      `Table "${table}" is not configured for soft-delete. Add it to SOFT_DELETABLE_TABLES if it has a deleted_at column.`
    );
  }

  return supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids);
}

/**
 * Permanently deletes a soft-deleted record (hard-delete after retention period)
 * Should only be used by admin cleanup jobs, not in normal application flow
 * @param supabase - Supabase client instance (with admin/service role key)
 * @param table - Table name
 * @param id - Record ID to permanently delete
 * @returns Promise with error if any
 */
export async function hardDeleteSoftDeleted(
  supabase: SupabaseClient,
  table: SoftDeletableTable,
  id: string
) {
  if (!SOFT_DELETABLE_TABLES.includes(table)) {
    throw new Error(`Table "${table}" is not configured for soft-delete.`);
  }

  return supabase.from(table).delete().eq('id', id).eq('deleted_at', 'not.null');
}

/**
 * Restores a soft-deleted record
 * @param supabase - Supabase client instance
 * @param table - Table name
 * @param id - Record ID to restore
 * @returns Promise with error if any
 */
export async function restoreSoftDeleted(
  supabase: SupabaseClient,
  table: SoftDeletableTable,
  id: string
) {
  if (!SOFT_DELETABLE_TABLES.includes(table)) {
    throw new Error(`Table "${table}" is not configured for soft-delete.`);
  }

  return supabase
    .from(table)
    .update({ deleted_at: null })
    .eq('id', id);
}
