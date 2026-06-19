export function labelToKey(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!slug) {
    return "column";
  }

  if (/^\d/.test(slug)) {
    return `col_${slug}`;
  }

  return slug;
}

export function uniqueColumnKey(label: string, existingKeys: string[]): string {
  const base = labelToKey(label);
  if (!existingKeys.includes(base)) {
    return base;
  }

  let index = 2;
  while (existingKeys.includes(`${base}_${index}`)) {
    index += 1;
  }

  return `${base}_${index}`;
}
