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
  // Maps category names to decimals (stored as strings)
  categories: { [key: string]: string };
}
