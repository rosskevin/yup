export function isSchema(s: any) {
  return s !== undefined && s !== null && typeof s === 'object' && (s as any).__isYupSchema__
}
