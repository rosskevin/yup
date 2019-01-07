import { BaseSchema } from '../types'
export default function isSchema(s: any): s is BaseSchema<any> {
  return s && (s as any).__isYupSchema__
}
