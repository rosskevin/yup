import { BaseSchema, Schema, ValidateOptions } from './types'
import isSchema from './util/isSchema'

export function lazy(fn: any) {
  return new Lazy(fn)
}

export type MapFn<T> = (options?: ValidateOptions) => Schema<T>

export class Lazy<T = any> implements BaseSchema<T> {
  // tslint:disable-next-line:variable-name
  public __isYupSchema__: boolean = true
  private mapFn: MapFn<T>

  constructor(mapFn: MapFn<T>) {
    this.mapFn = mapFn
  }

  public resolve(/*{ value, ...rest }*/ options: ValidateOptions) {
    return this._resolve(/*value, rest*/ options)
  }

  public cast(value: any, options?: ValidateOptions) {
    return this._resolve(/*value, options*/ options).cast(value, options)
  }

  public validate(value: any, options?: ValidateOptions) {
    return this._resolve(/*value, options*/ options).validate(value, options)
  }

  // tslint:disable-next-line:variable-name
  private _resolve = (/*...args*/ options?: ValidateOptions) => {
    const schema = this.mapFn(/*...args*/ options)
    if (!isSchema(schema)) {
      throw new TypeError('lazy() functions must return a valid schema')
    }

    return schema
  }
}
