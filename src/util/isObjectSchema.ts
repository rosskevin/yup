import has from 'lodash/has'
import { ObjectSchema } from '../ObjectSchema'
import { isMixedSchema } from './isMixedSchema'

export function isObjectSchema(s: any): s is ObjectSchema<any> {
  return isMixedSchema(s) && has(s, 'fields')
  // NOTE: do not use instanceof ObjectSchema because it causes cyclic
  // error `Class extends value undefined is not a constructor or null`
}
