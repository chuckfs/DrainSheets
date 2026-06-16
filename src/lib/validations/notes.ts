import { z } from "zod";

export const noteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Note content is required")
    .max(5000, "Note must be 5000 characters or fewer"),
});

export type NoteInput = z.infer<typeof noteSchema>;

export function parseNoteForm(formData: FormData) {
  return noteSchema.safeParse({
    content: formData.get("content"),
  });
}

export function noteInputToRow(input: NoteInput) {
  return {
    content: input.content.trim(),
  };
}
