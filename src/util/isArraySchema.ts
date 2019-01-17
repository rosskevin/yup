import has from 'lodash/has'
import { ArraySchema } from '../ArraySchema'
import { isMixedSchema } from './isMixedSchema'

export function isArraySchema(s: any): s is ArraySchema<any> {
  return isMixedSchema(s) && has(s, 'itemSchema')
  // NOTE: do not use instanceof ArraySchema because it causes cyclic
  // error `Class extends value undefined is not a constructor or null`
}
