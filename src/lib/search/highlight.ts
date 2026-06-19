export function highlightMatch(text: string, query: string): Array<{ text: string; match: boolean }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [{ text, match: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index < 0) {
    return [{ text, match: false }];
  }

  const parts: Array<{ text: string; match: boolean }> = [];

  if (index > 0) {
    parts.push({ text: text.slice(0, index), match: false });
  }

  parts.push({ text: text.slice(index, index + trimmed.length), match: true });

  const remainder = text.slice(index + trimmed.length);
  if (remainder) {
    parts.push({ text: remainder, match: false });
  }

  return parts;
}
