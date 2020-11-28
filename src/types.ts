// Internal to scrape.ts
export interface Session {
  session_id: string;
  apache_token: string;
}

// Internal to scrape.ts
export interface PDFFileInfo {
  id: string;
  filename: string;
}

// Used by client code
export interface PDFFile {
  title: string;
  content: string;
}

// Internal to scrape.ts
export interface ClassInfo {
  name: string;
  grades: Map<Quarter, string>;
  oid: string;
}

// Used by client code
export interface OverviewItem {
  class: string;
  teacher: string;
  term: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  ytd: string;
  absent: string;
  tardy: string;
  dismissed: string;
}

// Used by client code
export enum Quarter {
  Current = 0,
  Q1,
  Q2,
  Q3,
  Q4,
}
