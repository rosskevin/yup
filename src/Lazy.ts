// tslint:disable:variable-name

import { MixedSchema } from './MixedSchema'
import { BaseSchema, Schema, ValidateOptions } from './types'
import { isSchema } from './util/isSchema'

export type MapToSchemaFn<T> = (...args: any[]) => MixedSchema<T>

export function lazy<T>(mapToSchema: MapToSchemaFn<T>) {
  return new Lazy(mapToSchema)
}

/**
 * Creates a schema that is evaluated at validation/cast time.
 * Useful for creating recursive schema like Trees, for polymophic fields and arrays.
 *
 * CAUTION! When defining parent-child recursive object schema, you want to reset the
 * default() to undefined on the child otherwise the object will infinitely nest itself
 * when you cast it!.
 *
 * const node = object({
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
export class Lazy<T = any> implements BaseSchema<T> {
  public __isYupSchema__: boolean = true
  public _type: string = 'lazy'
  private mapToSchema: MapToSchemaFn<T>

  constructor(mapToSchema: MapToSchemaFn<T>) {
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

  private _resolve = (...args: any[]): MixedSchema<T> => {
    const schema = this.mapToSchema(...args)
    if (!isSchema(schema)) {
      throw new TypeError('lazy() functions must return a valid schema')
    }

    return schema
  }
}
