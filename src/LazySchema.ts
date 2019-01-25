// tslint:disable:variable-name

// FIXME: sync changes in lazy
// https://github.com/jquense/yup/blob/master/src/Lazy.js

import { AnyConcreteSchema, ValidateOptions } from './types'
import { isSchema } from './util/isSchema'

export type MapToSchemaFn = (...args: any[]) => AnyConcreteSchema

export function lazy(mapToSchema: MapToSchemaFn) {
  return new LazySchema(mapToSchema)
}

/**
 * Creates a schema that is evaluated at validation/cast time.
 * Useful for creating recursive schema like Trees, for polymophic fields and arrays.
 *
 * CAUTION! When defining parent-child recursive object schema, you want to reset the
 * default() to undefined on the child otherwise the object will infinitely nest itself
 * when you cast it!.
 *
 * const node = object().shape({
 *   id: number(),
 *   child: yup.lazy(() => node.default(undefined)),
 * })
 *
 * const renderable = yup.lazy(value => {
 *   switch (typeof value) {
 *     case 'number':
 *       return number()
 *     case 'string':
 *       return string()
 *     default:
 *       return mixed()
 *   }
 * })
 *
 * const renderables = array().of(renderable)
 *
 */
export class LazySchema {
  public __isYupSchema__: boolean = true
  public _type: string = 'lazy'
  private mapToSchema: MapToSchemaFn

  constructor(mapToSchema: MapToSchemaFn) {
    this.mapToSchema = mapToSchema
  }

  public resolve(/*{ value, ...rest }*/ options: ValidateOptions) {
    return this._resolve(/*value, rest*/ options)
  }

  public cast(value: any, options?: ValidateOptions) {
    return this._resolve(value, options).cast(value, options)
  }

  public describe() {
    return this._resolve().describe()
  }

  public validate(value: any, options?: ValidateOptions) {
    return this._resolve(value, options).validate(value, options)
  }

  private _resolve = (...args: any[]): AnyConcreteSchema => {
    const schema = this.mapToSchema(...args)
    if (!isSchema(schema)) {
      throw new TypeError('lazy() functions must return a valid schema')
    }

    return schema
  }
}
