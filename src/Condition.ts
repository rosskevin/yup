import has from 'lodash/has'
import { MixedSchema } from './MixedSchema'
import { Ref } from './Ref'
import { ValidateOptions } from './types'
import { isSchema } from './util/isSchema'

export type WhenIsFn = (...values: any[]) => boolean

export type WhenOptionsFn<T, S> = (values: any[], schema: S) => S | undefined

export type WhenIs = boolean | number | string | WhenIsFn

export type SorFn<T, S> = S | WhenOptionsFn<T, S>

export interface WhenIsThenOptions<T, S> {
  is: WhenIs
  then: SorFn<T, S>
  otherwise?: SorFn<T, S>
}

export interface WhenIsOtherwiseOptions<T, S> {
  is: WhenIs
  then?: SorFn<T, S>
  otherwise: SorFn<T, S>
}

export type WhenOptions<T, S extends MixedSchema<T>> =
  | WhenOptionsFn<T, S>
  | WhenIsThenOptions<T, S>
  | WhenIsOtherwiseOptions<T, S>

export default class Condition<T, S extends MixedSchema<T>> {
  public refs: Ref[]
  public fn: WhenOptionsFn<T, S>

  constructor(refs: Ref[], options: WhenOptions<T, S>) {
    this.refs = ([] as Ref[]).concat(refs)

    if (typeof options === 'function') {
      this.fn = options
    } else {
      /*
       * {
       *   is: true,  // alternatively: (isBig, isSpecial) => isBig && isSpecial
       *   then:      yup.number().min(5),
       *   otherwise: yup.number().min(0)
       * }
       */
      const { is: isOpt, then, otherwise } = options
      if (!has(options, 'is')) {
        throw new TypeError('`is` is required for `when()` conditions')
      }

      if (!options.then && !options.otherwise) {
        throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions')
      }

      let is: WhenIsFn
      if (typeof isOpt === 'function') {
        // (isBig, isSpecial) => isBig && isSpecial
        is = isOpt
      } else {
        // generate fn to check every value against `is`
        is = (...values: any[]) => {
          return values.every(v => v === (isOpt as any))
        }
      }

      this.fn = (values: any[], schema: S) => {
        // const schema = values.pop() // WTF as result of call? FIXME this is too confusing
        if (is(...values)) {
          return resolveSchema<T, S>(values, schema, then)
        } else {
          return resolveSchema<T, S>(values, schema, otherwise)
        }
      }
    }
  }

  public resolve({ context, parent }: ValidateOptions, schemaCaller: S): S {
    const values = this.refs.map(r => r.getValue(parent, context))
    return resolveSchema<T, S>(values, schemaCaller, this.fn)
  }
}

// tslint:disable-next-line:member-ordering
function resolveSchema<T, S>(values: any[], schemaCaller: S, sOrFn?: SorFn<T, S>): S {
  if (!sOrFn) {
    return schemaCaller
  }
  if (isSchema(sOrFn)) {
    return sOrFn as S
  }
  if (typeof sOrFn !== 'function') {
    throw new Error('Expected schema or function')
  }

  const fn: WhenOptionsFn<T, S> = sOrFn as any // FIXME
  // const schema = this.fn.apply(schemaCaller, values.concat(schemaCaller)) // FIXME wow so confusing
  // const schemaResult = fn.apply(schemaCaller, [values, schemaCaller])
  const schemaResult = fn(values, schemaCaller)
  if (schemaResult !== undefined && !isSchema(schemaResult)) {
    throw new TypeError('conditions must return a schema object')
  }

  return schemaResult || schemaCaller
}
