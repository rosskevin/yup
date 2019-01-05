import Ref from './util/Ref'
import Lazy from './Lazy'
import ValidationError from './ValidationError'
import reach from './util/reach'
import isSchema from './util/isSchema'
import setLocale from './setLocale'

let ref = (key, options) => new Ref(key, options)

let lazy = fn => new Lazy(fn)

function addMethod(schemaType, name, fn) {
  if (!schemaType || !isSchema(schemaType.prototype))
    throw new TypeError('You must provide a yup schema constructor function')

  if (typeof name !== 'string') throw new TypeError('A Method name must be provided')
  if (typeof fn !== 'function') throw new TypeError('Method function must be provided')

  schemaType.prototype[name] = fn
}

export * from './ArraySchema'
export * from './BooleanSchema'
export * from './DateSchema'
export * from './MixedSchema'
export * from './NumberSchema'
export * from './ObjectSchema'
export * from './StringSchema'

export { ref, lazy, reach, isSchema, addMethod, setLocale, ValidationError }
