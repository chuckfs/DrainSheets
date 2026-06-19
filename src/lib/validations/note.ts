import { z } from "zod";

export const createNoteSchema = z.object({
  sheetId: z.string().uuid(),
  content: z.string().trim().min(1, "Note cannot be empty").max(10000),
  rowId: z.string().uuid().optional().nullable(),
});

export const updateNoteSchema = z.object({
  noteId: z.string().uuid(),
  content: z.string().trim().min(1, "Note cannot be empty").max(10000),
});

export const deleteNoteSchema = z.object({
  noteId: z.string().uuid(),
});
