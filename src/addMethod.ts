// tslint:disable:ban-types

import { MixedSchema } from './MixedSchema'
import { isSchema } from './util/isSchema'

export function addMethod<T extends MixedSchema<any>>(
  schemaType: Function,
  name: string,
  fn: (this: T, ...args: any[]) => T,
) {
  if (!schemaType || !isSchema(schemaType.prototype)) {
    throw new TypeError('You must provide a yup schema constructor function')
  }

  if (typeof name !== 'string') {
    throw new TypeError('A Method name must be provided')
  }
  if (typeof fn !== 'function') {
    throw new TypeError('Method function must be provided')
  }

  schemaType.prototype[name] = fn
}
