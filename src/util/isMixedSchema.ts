import { MixedSchema } from '../MixedSchema'
import { isSchema } from './isSchema'

export function isMixedSchema(s: any): s is MixedSchema<any> {
  return isSchema(s) && s instanceof MixedSchema
}
