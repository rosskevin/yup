import { BaseSchema } from '../types'
export default function isSchema(s: any): s is BaseSchema<any> {
  return s !== undefined && s !== null && typeof s === 'object' && (s as any).__isYupSchema__
}
