export function contactDisplayName(contact: {
  first_name: string;
  last_name?: string | null;
}): string {
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ");
}
