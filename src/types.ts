import { Quarter } from "./types-shared";

export interface Session {
  session_id: string;
  apache_token: string;
}

export interface PDFFileInfo {
  id: string;
  filename: string;
}

export interface ClassInfo {
  name: string;
  grades: Map<Quarter, string>;
  teacher: string;
  term: string;
  oid: string;
}

export interface ClassDetails extends ClassInfo {
  attendance: {
    absent: number;
    tardy: number;
    dismissed: number;
  };
  // Maps category names to weights (as decimals) and OIDs
  categories: Map<string, Category>;
}

export interface Category {
  weight: number;
  oid: string;
}

// TODO support week specifiers (W1 to W14) which may be used for RSTA
// Exploratory; use Aspen schedule to find mapping
export type TermSpec = "FY" | "S1" | "S2" | "Q1" | "Q2" | "Q3" | "Q4";

export enum AspineErrorCode {
  LOGINFAIL = "loginfail",
  ASPENDOWN = "aspendown",
}
