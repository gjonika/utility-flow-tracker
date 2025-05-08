
import { UtilityEntry } from './types';

/**
 * Mapping utilities for Supabase data
 */

// Map our app model to Supabase schema
export const mapToSupabaseModel = (entry: UtilityEntry) => {
  return {
    id: entry.id,
    utilitytype: entry.utilityType,
    supplier: entry.supplier,
    readingdate: entry.readingDate,
    reading: entry.reading,
    unit: entry.unit,
    amount: entry.amount,
    notes: entry.notes,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt
  };
};

// Map from Supabase model to our app model
export const mapFromSupabaseModel = (record: any): UtilityEntry => {
  return {
    id: record.id,
    utilityType: record.utilitytype,
    supplier: record.supplier,
    readingDate: record.readingdate,
    reading: record.reading,
    unit: record.unit,
    amount: record.amount,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    synced: true
  };
};
