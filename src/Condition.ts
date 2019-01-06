import has from 'lodash/has'
import { Ref } from './Ref'
import { Schema, WhenIsFn, WhenOptions, WhenOptionsFn } from './types'
import isSchema from './util/isSchema'

function callOrConcat<T>(schema: Schema<T>) {
  if (typeof schema === 'function') {
    return schema
  }

  return (base: any) => base.concat(schema)
}

export default class Condition<T> {
  public refs: Ref[]
  public fn: WhenOptionsFn<T>

  constructor(refs: Ref[], options: WhenOptions<T>) {
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
      const { is, then: thenOpt, otherwise: otherwiseOpt } = options
      const then = callOrConcat(thenOpt)
      const otherwise = callOrConcat(otherwiseOpt)
      if (!has(options, 'is')) {
        throw new TypeError('`is` is required for `when()` conditions')
      }

      if (!options.then && !options.otherwise) {
        throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions')
      }

      let isFn: WhenIsFn
      if (typeof is === 'function') {
        // (isBig, isSpecial) => isBig && isSpecial
        isFn = is
      } else {
        // generate fn to check every value against `is`
        isFn = (values: any[]) => values.every(value => value === (is as any))
      }

      this.fn = (values: any[]) => {
        const currentSchema = values.pop() // WTF as result of call? FIXME this is too confusing
        const option = isFn(values) ? then : otherwise
        return option(currentSchema)
      }
    }
  }

  public getValue(parent: any, context: any) {
    const values = this.refs.map(r => r.getValue(parent, context))

    return values
  }

  public resolve(ctx: any, values: any[]): Schema<T> {
    const schema = this.fn.apply(ctx, values.concat(ctx) as any) // FIXME wow so confusing

    if (schema !== undefined && !isSchema(schema)) {
      throw new TypeError('conditions must return a schema object')
    }

    return schema || ctx
  }
}
