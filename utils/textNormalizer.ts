export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizeBrandText(text: string): string {
  return text.replace(/JB(?:³|3)\s*AI/gi, 'JB 3 A I');
}

export function normalizeScript(text: string): string {
  const branded = normalizeBrandText(text);
  return escapeXml(branded);
}
