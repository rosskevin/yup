import { ObjectSchema } from '../ObjectSchema'
import { isMixedSchema } from './isMixedSchema'

export function isObjectSchema(s: any): s is ObjectSchema<any> {
  return isMixedSchema(s) && s instanceof ObjectSchema
}
