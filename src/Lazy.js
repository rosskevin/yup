import isSchema from './util/isSchema'

export function lazy(fn) {
  return new Lazy(fn)
}
export class Lazy {
  __isYupSchema__ = true
  constructor(mapFn) {
    this._resolve = (...args) => {
      let schema = mapFn(...args)
      if (!isSchema(schema)) throw new TypeError('lazy() functions must return a valid schema')

      return schema
    }
  }

  resolve({ value, ...rest }) {
    return this._resolve(value, rest)
  }

  cast(value, options) {
    return this._resolve(value, options).cast(value, options)
  }

  validate(value, options) {
    return this._resolve(value, options).validate(value, options)
  }
}
