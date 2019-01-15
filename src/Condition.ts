import has from 'lodash/has'
import { MixedSchema } from './MixedSchema'
import { Ref } from './Ref'
// import { Schema } from './types'
import { isSchema } from './util/isSchema'

export type WhenIsFn = (...values: any[]) => boolean

export type WhenOptionsFn<T, S> = (value: any, schema: S) => S // | undefined

export type WhenIs = boolean | number | string | WhenIsFn

export interface WhenIsThenOptions<T, S> {
  is: WhenIs
  then: S | WhenOptionsFn<T, S>
  otherwise?: S | WhenOptionsFn<T, S>
}

export interface WhenIsOtherwiseOptions<T, S> {
  is: WhenIs
  then?: S | WhenOptionsFn<T, S>
  otherwise: S | WhenOptionsFn<T, S>
}

export type WhenOptions<T, S extends MixedSchema<T> = MixedSchema<T>> =
  | WhenOptionsFn<T, S>
  | WhenIsThenOptions<T, S>
  | WhenIsOtherwiseOptions<T, S>

function callOrConcat<T, S extends MixedSchema<T> = MixedSchema<T>>(
  thenOrOtherwise: S | WhenOptionsFn<T, S> | undefined,
) {
  if (typeof thenOrOtherwise === 'function') {
    return thenOrOtherwise
  }

  return (base: S) => (thenOrOtherwise !== undefined ? base.concat(thenOrOtherwise) : base)
}

export default class Condition<T, S extends MixedSchema<T>> {
  public refs: Ref[]
  public fn: WhenOptionsFn<T, S>

  constructor(refs: Ref[], options: WhenOptions<T>) {
    this.refs = ([] as Ref[]).concat(refs)

    if (typeof options === 'function') {
      this.fn = (options as any) as WhenOptionsFn<T, S> // FIXME why need to untype first?
    } else {
      /*
       * {
       *   is: true,  // alternatively: (isBig, isSpecial) => isBig && isSpecial
       *   then:      yup.number().min(5),
       *   otherwise: yup.number().min(0)
       * }
       */
      const { is: isOpt, then: thenOpt, otherwise: otherwiseOpt } = options
      const then = callOrConcat(thenOpt)
      const otherwise = callOrConcat(otherwiseOpt)
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
        is = (...values: any[]) => values.every(value => value === (is as any))
      }

      this.fn = (...values: any[]) => {
        const currentSchema = values.pop() // WTF as result of call? FIXME this is too confusing
        if (is(values)) {
          return (then as any)(currentSchema) // FIXME: type needs resolved
        } else {
          return (otherwise as any)(currentSchema) // FIXME: type needs resolved
        }
      }
    }
  }

  public getValue(parent: any, context: any) {
    const values = this.refs.map(r => r.getValue(parent, context))

    return values
  }

  public resolve(ctx: any, values: any[]) {
    const schema = this.fn.apply(ctx, values.concat(ctx) as any) // FIXME wow so confusing

    if (schema !== undefined && !isSchema(schema)) {
      throw new TypeError('conditions must return a schema object')
    }

    return schema || ctx
  }
}
