import { BaseSchema, ValidateOptions } from './types'
import isSchema from './util/isSchema'

export function lazy(fn: any) {
  return new Lazy(fn)
}
export class Lazy<T = any> implements BaseSchema<T> {
  // tslint:disable-next-line:variable-name
  public __isYupSchema__: boolean = true
  private mapFn: any

  constructor(mapFn: any) {
    this.mapFn = mapFn
  }

  public resolve({ value, ...rest }: ValidateOptions) {
    return this._resolve(value, rest)
  }

  public cast(value: any, options?: ValidateOptions) {
    return this._resolve(value, options).cast(value, options)
  }

  public validate(value, options) {
    return this._resolve(value, options).validate(value, options)
  }

  private _resolve = (...args) => {
    const schema = this.mapFn(...args)
    if (!isSchema(schema)) {
      throw new TypeError('lazy() functions must return a valid schema')
    }

    return schema
  }
}
