import { MixedSchema } from '../MixedSchema'
import getIn from './getIn'

export function reach<S extends MixedSchema>(schema: S, path: string, value?: any, context?: any) {
  return getIn(schema, path, value, context).schema
}
