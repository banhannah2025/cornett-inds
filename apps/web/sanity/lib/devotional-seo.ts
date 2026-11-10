function fitText(text: string, max: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const prefix = normalized.slice(0, max - 1);
  const lastSpace = prefix.lastIndexOf(" ");
  return `${lastSpace > max / 2 ? prefix.slice(0, lastSpace) : prefix}…`;
}

export function devotionalSeoDefaults(title: string, excerpt: string) {
  return {
    seoTitle: fitText(title, 65),
    seoDescription: fitText(excerpt, 160),
  };
}
