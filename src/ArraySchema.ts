// tslint:disable:variable-name

import { locale } from './locale'
import { MixedSchema } from './MixedSchema'
import { AnySchema, Message, TransformFunction, ValidateOptions } from './types'
import { isAbsent } from './util/isAbsent'
import { isMixedSchema } from './util/isMixedSchema'
import { isSchema } from './util/isSchema'
import makePath from './util/makePath'
import printValue from './util/printValue'
import propagateErrors from './util/propagateErrors'
import runValidations from './util/runValidations'
import { ValidationError } from './ValidationError'

function hasLength(value: any) {
  return !isAbsent(value) && value.length > 0
}

export function array<T = any[]>() {
  return new ArraySchema<T>()
}

export class ArraySchema<T = any[]> extends MixedSchema<T> {
  public itemSchema?: MixedSchema<T> | false

  constructor() {
    super({ type: 'array' })

    // `undefined` specifically means uninitialized, as opposed to "no subtype"
    this.itemSchema = undefined // FIXME why doesn't this use type if defined? waits to use of()?

    this.withMutation(() => {
      this.transform(function(values) {
        if (typeof values === 'string') {
          try {
            values = JSON.parse(values)
          } catch (err) {
            values = null
          }
        }

        return this.isType(values) ? values : null
      })

      // if (itemSchema) {
      //   this.of(itemSchema)
      // }
    })
  }

  public _typeCheck(v: any): v is any[] {
    return Array.isArray(v)
  }

  public _cast(_value: any, _opts: ValidateOptions): any {
    const value = super._cast(_value, _opts)

    // should ignore nulls here
    if (!this._typeCheck(value) || !this.itemSchema) {
      return value
    }

    let isChanged = false
    const castArray = value.map(v => {
      const castElement = this.assertSubtype().cast(v, _opts)
      if (castElement !== v) {
        isChanged = true
      }

      return castElement
    })

    return isChanged ? castArray : value
  }

  public _validate(_value: any, options: ValidateOptions = {}): Promise<T> {
    const errors: ValidationError[] = []
    const sync = options.sync
    const path = options.path
    const subType = this.itemSchema
    const endEarly = this._option('abortEarly', options)
    const recursive = this._option('recursive', options)

    let originalValue = options.originalValue != null ? options.originalValue : _value

    return super
      ._validate(_value, options)
      .catch(propagateErrors(endEarly, errors))
      .then(value => {
        if (!recursive || !subType || !this._typeCheck(value)) {
          if (errors.length) {
            throw errors[0]
          }
          return value
        }

        originalValue = originalValue || value

        const validations = value.map((item, idx) => {
          // object._validate note for isStrict explanation
          const innerOptions = {
            ...options,
            originalValue: originalValue[idx],
            parent: value,
            path: makePath([`${options.path}[${idx}]`]),
            strict: true,
          }

          if (subType.validate) {
            return subType.validate(item, innerOptions)
          }

          return true
        })

        return runValidations({
          endEarly,
          errors,
          path,
          sync,
          validations,
          value,
        })
      })
  }

  // public of(itemSchema: false | AnySchema): this {
  //   const next: this = this.clone()

  //   // if (itemSchema === false) {
  //   //   return next
  //   // }

  //   if (isMixedSchema(itemSchema)) {
  //     next.itemSchema = itemSchema
  //     return next
  //   } else {
  //     throw new TypeError(
  //       '`array.of()` sub-schema must be a valid schema, or `false` to negate a current sub-schema. ' +
  //         'not: ' +
  //         printValue(itemSchema as any),
  //     )
  //   }
  // }
  public of(schema: false | AnySchema): this {
    const next = this.clone()

    if (schema !== false && !isSchema(schema)) {
      throw new TypeError(
        '`array.of()` sub-schema must be a valid yup schema, or `false` to negate a current sub-schema. ' +
          'not: ' +
          printValue(schema),
      )
    }

    // tslint:disable-next-line
    ;(next as any).itemSchema = schema // FIXME if this is lazy is this going to be propagated?

    return next
  }

  public required(message = locale.mixed.required): this {
    const next = super.required(message)

    return next.test({
      message,
      name: 'required',
      test: hasLength,
    })
  }

  public min(min: number, message?: Message) {
    message = message || locale.array.min

    return this.test({
      exclusive: true,
      message,
      name: 'min',
      params: { min },
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min)
      },
    })
  }

  public max(max: number, message?: Message) {
    message = message || locale.array.max
    return this.test({
      exclusive: true,
      message,
      name: 'max',
      params: { max },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max)
      },
    })
  }

  public ensure() {
    return this.default(() => []).transform(val => {
      if (this.isType(val)) {
        return val
      }
      return val === null ? [] : [].concat(val)
    })
  }

  public compact(rejector?: (value: T, index: number, array: T[]) => boolean) {
    const rejectorFn = !rejector
      ? (v: any[]) => !!v
      : (v: any, i: any, a: any) => !rejector(v, i, a)

    const transformFn: TransformFunction<T> = (value: any) =>
      value != null ? (value as any[]).filter(rejectorFn) : value
    return this.transform(transformFn)
  }

  public describe() {
    const base = super.describe()
    if (this.itemSchema) {
      base.innerType = this.itemSchema.describe() // FIXME - this is explicitly subType - WHY call it innerType here?
    }
    return base
  }

  protected assertSubtype() {
    if (!this.itemSchema) {
      throw new Error('Expected subType to be set')
    }
    return this.itemSchema
  }
}
