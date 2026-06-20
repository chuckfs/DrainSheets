import { z } from "zod";

export const rowFilterConditionSchema = z.object({
  columnKey: z.string().min(1).max(64),
  operator: z.enum(["contains", "equals", "not_equals", "is_empty", "is_not_empty"]),
  value: z.string(),
});

export const rowSortSchema = z.object({
  columnKey: z.string().min(1).max(64),
  direction: z.enum(["asc", "desc"]),
});

export const createSheetViewSchema = z.object({
  sheetId: z.string().uuid(),
  name: z.string().min(1).max(120),
  sort: rowSortSchema.nullable().optional(),
  filters: z.array(rowFilterConditionSchema).default([]),
  hiddenColumnKeys: z.array(z.string()).default([]),
  hiddenRowIds: z.array(z.string().uuid()).default([]),
});

export const updateSheetViewSchema = z.object({
  viewId: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  sort: rowSortSchema.nullable().optional(),
  filters: z.array(rowFilterConditionSchema).optional(),
  hiddenColumnKeys: z.array(z.string()).optional(),
  hiddenRowIds: z.array(z.string().uuid()).optional(),
});

export const deleteSheetViewSchema = z.object({
  viewId: z.string().uuid(),
});
