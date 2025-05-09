
import { z } from "zod";

export type UtilityType = "electricity" | "water" | "gas" | "internet" | "heat" | "hot_water" | "cold_water" | "phone" | "housing_service" | "renovation" | "loan" | "interest" | "insurance" | "waste" | "other";

export const UtilityEntrySchema = z.object({
  id: z.string().uuid().optional(),
  utilityType: z.enum(["electricity", "water", "gas", "internet", "heat", "hot_water", "cold_water", "phone", "housing_service", "renovation", "loan", "interest", "insurance", "waste", "other"]),
  supplier: z.string().min(1, "Supplier name is required"),
  readingDate: z.string(),
  reading: z.number().nullable().optional(),
  unit: z.string().optional(),
  amount: z.number().min(0, "Amount must be a positive number"),
  notes: z.string().optional(),
  synced: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  paymentDate: z.string().nullable().optional(),
  paymentReference: z.string().nullable().optional()
});

export type UtilityEntry = z.infer<typeof UtilityEntrySchema>;

export const NewUtilityEntrySchema = UtilityEntrySchema.omit({ 
  id: true,
  synced: true,
  createdAt: true,
  updatedAt: true 
});

export type NewUtilityEntry = z.infer<typeof NewUtilityEntrySchema>;

export type UtilitySupplier = {
  id: string;
  utilityType: UtilityType;
  name: string;
  unit?: string;
  requiresReading?: boolean;
};
