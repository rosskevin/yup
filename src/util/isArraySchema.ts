import { ArraySchema } from '../ArraySchema'
import { isMixedSchema } from './isMixedSchema'

export function isArraySchema(s: any): s is ArraySchema<any> {
  return isMixedSchema(s) && s instanceof ArraySchema
}
