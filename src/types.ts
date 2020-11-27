export type Session = {
  session_id: string,
  apache_token: string,
};

export type PDFFileInfo = {
  id: string,
  filename: string,
};

export type PDFFile = {
  title: string,
  content: string,
};

export type ClassInfo = {
  name: string,
  grade: string,
  oid: string,
};

export const enum Quarter {
  Current = 0,
  Q1,
  Q2,
  Q3,
  Q4,
}
