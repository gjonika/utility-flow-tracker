
import { UtilityEntry, UtilitySupplier } from './types';

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
    updated_at: entry.updatedAt,
    payment_date: entry.paymentDate,
    payment_reference: entry.paymentReference
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
    synced: true,
    paymentDate: record.payment_date,
    paymentReference: record.payment_reference
  };
};

// Map from Supabase supplier model to our app model
export const mapFromSupabaseSupplierModel = (record: any): UtilitySupplier => {
  return {
    id: record.id,
    utilityType: record.utilitytype,
    name: record.name,
    unit: record.unit,
    requiresReading: record.requires_reading
  };
};
