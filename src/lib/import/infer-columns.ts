import type { ColumnType } from "@/types/domain";
import { uniqueColumnKey } from "@/lib/sheets/column-key";
import type { ImportRow, InferredColumn } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const URL_RE = /^(https?:\/\/|www\.)/i;
const PHONE_RE = /^[+()\-.\s\d]{7,}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const US_DATE_RE = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;
const CURRENCY_RE = /^[\s$€£¥]?-?\d{1,3}(?:,\d{3})*(?:\.\d+)?[\s$€£¥]?$/;
const CHECKBOX_TRUE = new Set(["true", "yes", "y", "1", "checked", "x"]);
const CHECKBOX_FALSE = new Set(["false", "no", "n", "0", "unchecked", ""]);

function sampleValues(rows: ImportRow[], header: string, limit = 50): ImportRow[string][] {
  const values: ImportRow[string][] = [];

  for (const row of rows) {
    const value = row[header];
    if (value !== null && value !== undefined && value !== "") {
      values.push(value);
      if (values.length >= limit) {
        break;
      }
    }
  }

  return values;
}

function allMatch(values: ImportRow[string][], predicate: (value: string) => boolean): boolean {
  if (values.length === 0) {
    return false;
  }

  return values.every((value) => predicate(String(value).trim()));
}

function detectColumnType(header: string, values: ImportRow[string][]): ColumnType {
  const normalizedHeader = header.toLowerCase();

  if (normalizedHeader.includes("email")) {
    return "email";
  }

  if (normalizedHeader.includes("phone") || normalizedHeader.includes("mobile")) {
    return "phone";
  }

  if (normalizedHeader.includes("website") || normalizedHeader.includes("url")) {
    return "url";
  }

  if (
    normalizedHeader.includes("price") ||
    normalizedHeader.includes("amount") ||
    normalizedHeader.includes("cost") ||
    normalizedHeader.includes("ppsf")
  ) {
    return "currency";
  }

  if (normalizedHeader.includes("date")) {
    return "date";
  }

  if (normalizedHeader.includes("comment") || normalizedHeader.includes("notes")) {
    return "long_text";
  }

  if (normalizedHeader.includes("contact")) {
    return "contact";
  }

  if (allMatch(values, (value) => CHECKBOX_TRUE.has(value.toLowerCase()) || CHECKBOX_FALSE.has(value.toLowerCase()))) {
    return "checkbox";
  }

  if (allMatch(values, (value) => EMAIL_RE.test(value))) {
    return "email";
  }

  if (allMatch(values, (value) => URL_RE.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(value))) {
    return "url";
  }

  if (allMatch(values, (value) => PHONE_RE.test(value))) {
    return "phone";
  }

  if (
    allMatch(
      values,
      (value) => ISO_DATE_RE.test(value) || US_DATE_RE.test(value) || !Number.isNaN(Date.parse(value)),
    )
  ) {
    return "date";
  }

  if (allMatch(values, (value) => CURRENCY_RE.test(value))) {
    return "currency";
  }

  if (allMatch(values, (value) => !Number.isNaN(Number(value.replace(/,/g, ""))))) {
    return "number";
  }

  if (values.some((value) => String(value).length > 200 || String(value).includes("\n"))) {
    return "long_text";
  }

  return "text";
}

export function inferColumns(headers: string[], rows: ImportRow[]): InferredColumn[] {
  const usedKeys: string[] = [];

  return headers.map((header, index) => {
    const values = sampleValues(rows, header);
    const type = detectColumnType(header, values);
    const key = uniqueColumnKey(header, usedKeys);
    usedKeys.push(key);

    return {
      sourceHeader: header,
      key,
      label: header.trim() || `Column ${index + 1}`,
      type,
      position: index,
      isPrimary: index === 0,
    };
  });
}
