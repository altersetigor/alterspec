/** Replace `{{key}}` placeholders. Unknown keys are left in place. */
export function renderTemplate(source: string, vars: Record<string, string>): string {
  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) => vars[key] ?? match);
}
