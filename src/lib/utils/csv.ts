
import { UtilityEntry } from "../types";
import { parse } from "date-fns";

// Expected headers for the CSV file
export const EXPECTED_HEADERS = [
  "utilitytype",
  "supplier",
  "readingdate",
  "reading",
  "unit",
  "amount",
  "notes",
];

// Type for CSV row validation errors
export type ValidationError = {
  rowIndex: number;
  field: string;
  message: string;
};

// Type for a CSV row
export type CSVRow = {
  [key: string]: string;
};

// Type for a validated entry with potential errors
export type ValidatedEntry = {
  entry: Partial<UtilityEntry>;
  errors: ValidationError[];
  rowIndex: number;
  rawData: CSVRow;
};

/**
 * Parse CSV content into rows and headers
 */
export const parseCSV = (content: string): { headers: string[]; rows: CSVRow[] } => {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Parse headers (first line)
  const headers = lines[0].split(",").map(header => header.trim().toLowerCase());

  // Parse rows
  const rows = lines.slice(1).map(line => {
    const values = line.split(",").map(val => val.trim());
    const row: CSVRow = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    
    return row;
  });

  return { headers, rows };
};

/**
 * Validate CSV headers
 */
export const validateHeaders = (headers: string[]): string[] => {
  const missingHeaders = EXPECTED_HEADERS.filter(
    header => !headers.includes(header)
  );
  return missingHeaders;
};

/**
 * Validate a single CSV row and convert to UtilityEntry
 */
export const validateRow = (row: CSVRow, rowIndex: number): ValidatedEntry => {
  const errors: ValidationError[] = [];
  const entry: Partial<UtilityEntry> = {};
  
  // Validate utility type
  if (!row.utilitytype) {
    errors.push({
      rowIndex,
      field: "utilitytype",
      message: "Utility type is required",
    });
  } else {
    // Define valid utility types as a string array
    const validUtilityTypes = [
      "electricity", "water", "gas", "internet", "heat", 
      "hot_water", "cold_water", "phone", "housing_service", 
      "renovation", "loan", "interest", "insurance", "waste", "other"
    ] as const;
    
    const isValidType = validUtilityTypes.includes(row.utilitytype as any);
    if (!isValidType) {
      errors.push({
        rowIndex,
        field: "utilitytype",
        message: `Invalid utility type: ${row.utilitytype}`,
      });
    } else {
      // Use type assertion to ensure the string is of the correct utility type
      entry.utilityType = row.utilitytype as UtilityEntry["utilityType"];
    }
  }

  // Validate supplier
  if (!row.supplier) {
    errors.push({
      rowIndex,
      field: "supplier",
      message: "Supplier is required",
    });
  } else {
    entry.supplier = row.supplier;
  }

  // Validate reading date
  if (!row.readingdate) {
    errors.push({
      rowIndex,
      field: "readingdate",
      message: "Reading date is required",
    });
  } else {
    try {
      // Try to parse date in YYYY-MM-DD format
      const date = parse(row.readingdate, "yyyy-MM-dd", new Date());
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      entry.readingDate = row.readingdate;
    } catch (error) {
      errors.push({
        rowIndex,
        field: "readingdate",
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }
  }

  // Validate reading (optional)
  if (row.reading) {
    const readingValue = parseFloat(row.reading);
    if (isNaN(readingValue)) {
      errors.push({
        rowIndex,
        field: "reading",
        message: "Reading must be a number",
      });
    } else {
      entry.reading = readingValue;
    }
  } else {
    entry.reading = null;
  }

  // Set unit (optional)
  entry.unit = row.unit || null;

  // Validate amount
  if (!row.amount) {
    errors.push({
      rowIndex,
      field: "amount",
      message: "Amount is required",
    });
  } else {
    const amountValue = parseFloat(row.amount);
    if (isNaN(amountValue)) {
      errors.push({
        rowIndex,
        field: "amount",
        message: "Amount must be a number",
      });
    } else if (amountValue < 0) {
      errors.push({
        rowIndex,
        field: "amount",
        message: "Amount must be positive",
      });
    } else {
      entry.amount = amountValue;
    }
  }

  // Set notes (optional)
  entry.notes = row.notes || null;

  return {
    entry,
    errors,
    rowIndex,
    rawData: row
  };
};

/**
 * Process CSV content and validate all rows
 */
export const processCSV = (content: string): {
  validatedEntries: ValidatedEntry[],
  headerErrors: string[]
} => {
  const { headers, rows } = parseCSV(content);
  const headerErrors = validateHeaders(headers);
  
  if (headerErrors.length > 0) {
    return { validatedEntries: [], headerErrors };
  }
  
  const validatedEntries = rows.map((row, index) => 
    validateRow(row, index)
  );
  
  return { validatedEntries, headerErrors: [] };
};
