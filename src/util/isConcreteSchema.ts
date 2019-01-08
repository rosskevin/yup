import { MixedSchema } from '../MixedSchema'
import isSchema from './isSchema'

export default function isConcreteSchema(s: any): s is MixedSchema<any> {
  return isSchema(s) && s instanceof MixedSchema
}
