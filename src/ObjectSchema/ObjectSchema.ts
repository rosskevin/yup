// tslint:disable:variable-name

import camelCase from 'lodash/camelCase'
import has from 'lodash/has'
import mapKeys from 'lodash/mapKeys'
import snakeCase from 'lodash/snakeCase'
import { locale } from '../locale'
import { MixedSchema } from '../MixedSchema'
import { BaseSchema, Schema, SchemaDescription, ValidateOptions } from '../types'
import { getter } from '../util/expression'
import { isObject } from '../util/isObject'
import makePath from '../util/makePath'
import propagateErrors from '../util/propagateErrors'
import runValidations from '../util/runValidations'
import { ValidationError } from '../ValidationError'
import sortByKeyOrder from './sortByKeyOrder'
import sortFields from './sortFields'

function unknown(ctx: any, value: any) {
  const known = Object.keys(ctx.fields)
  return Object.keys(value).filter(key => known.indexOf(key) === -1)
}

export interface SchemaShape {
  [key: string]: BaseSchema<any>
}
export function object(schemaShape?: SchemaShape) {
  return new ObjectSchema(schemaShape)
}

/**
 * Define an object schema. Options passed into isValid are also passed to child schemas.
 * Supports all the same methods as mixed.
 *
 * yup.object().shape({
 *   name: string().required(),
 *   age: number()
 *     .required()
 *     .positive()
 *     .integer(),
 *   email: string().email(),
 *   website: string().url(),
 * });
 * You can also pass a shape to the object constructor as a convenience.
 *
 * object().shape({
 *   num: number(),
 * });
 * //or
 * object({
 *   num: number(),
 * });
 * The default cast behavior for object is: JSON.parse
 *
 * Failed casts return: null;
 */
export class ObjectSchema<T = any> extends MixedSchema<T> {
  public fields: SchemaShape = {}
  private _nodes: any[] = []
  private _excludedEdges: any[] = []

  constructor(schemaShape?: any) {
    super({
      default: () => {
        // FIXME a really ugly way to override/augment the default() implementation in super
        if (!this._nodes.length) {
          return undefined
        }

        const dft = {}
        this._nodes.forEach(key => {
          dft[key] = (this.fields[key] as any).default
            ? (this.fields[key] as MixedSchema).default()
            : undefined
        })
        return dft
      },
      type: 'object',
    })

    this.withMutation(() => {
      this.transform(function coerce(value) {
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch (err) {
            value = null
          }
        }
        if (this.isType(value)) {
          return value
        }
        return null
      })

      if (schemaShape) {
        this.shape(schemaShape)
      }
    })
  }

  public _typeCheck(value: any) {
    return isObject(value) || typeof value === 'function'
  }

  public _cast(_value: any, options: ValidateOptions = {}) {
    const value = super._cast(_value, options)

    // should ignore nulls here
    if (value === undefined) {
      return this.default()
    }

    if (!this._typeCheck(value)) {
      return value
    }

    const fields = this.fields
    const strip = this._option('stripUnknown', options) === true
    const props = this._nodes.concat(Object.keys(value).filter(v => this._nodes.indexOf(v) === -1))
    const intermediateValue = {} // is filled during the transform below
    const innerOptions: ValidateOptions = {
      ...options,
      __validating: false,
      parent: intermediateValue,
    }

    let isChanged = false
    props.forEach(prop => {
      let field = fields[prop]
      const exists = has(value, prop)

      if (field) {
        let fieldValue
        const strict = (field as any)._options && (field as MixedSchema)._options.strict

        // safe to mutate since this is fired in sequence
        innerOptions.path = makePath([`${options.path}.${prop}`])
        // innerOptions.value = value[prop] // FIXME not conforming to signature

        field = field.resolve(innerOptions)

        if ((field as any)._strip === true) {
          isChanged = isChanged || prop in value
          return
        }

        fieldValue =
          !options.__validating || !strict ? field.cast(value[prop], innerOptions) : value[prop]

        if (fieldValue !== undefined) {
          intermediateValue[prop] = fieldValue
        }
      } else if (exists && !strip) {
        intermediateValue[prop] = value[prop]
      }

      if (intermediateValue[prop] !== value[prop]) {
        isChanged = true
      }
    })
    return isChanged ? intermediateValue : value
  }

  public _validate(_value: any, opts: ValidateOptions = {}) {
    const endEarly = this._option('abortEarly', opts)
    const recursive = this._option('recursive', opts)
    const sync = opts.sync
    const errors: ValidationError[] = []
    let originalValue = opts.originalValue != null ? opts.originalValue : _value

    opts = { ...opts, __validating: true, originalValue }

    return MixedSchema.prototype._validate
      .call(this, _value, opts)
      .catch(propagateErrors(endEarly, errors))
      .then(value => {
        if (!recursive || !isObject(value)) {
          // only iterate though actual objects
          if (errors.length) {
            throw errors[0]
          }
          return value
        }

        originalValue = originalValue || value

        const validations = this._nodes.map(key => {
          const path = makePath([`${opts.path}.${key}`])
          const field = this.fields[key]

          const innerOptions = {
            ...opts,
            originalValue: originalValue[key],
            parent: value,
            path,
          }

          if (field) {
            // inner fields are always strict:
            // 1. this isn't strict so the casting will also have cast inner values
            // 2. this is strict in which case the nested values weren't cast either
            innerOptions.strict = true

            if (field.validate) {
              return field.validate(value[key], innerOptions)
            }
            return Promise.resolve(true)
          }

          return true
        })

        return runValidations({
          endEarly,
          errors,
          path: opts.path,
          sort: sortByKeyOrder(this.fields),
          sync,
          validations,
          value,
        })
      })
  }

  public concat(schema: Schema<T>): this {
    const next = super.concat(schema)
    next._nodes = sortFields(next.fields, next._excludedEdges)
    return next
  }

  /**
   * Define the keys of the object and the schemas for said keys.
   *
   * Note that you can chain shape method, which acts like object extends, for example:
   *
   * object({
   *   a: string(),
   *   b: number(),
   * }).shape({
   *   b: string(),
   *   c: number(),
   * });
   * would be exactly the same as:
   *
   * object({
   *   a: string(),
   *   b: string(),
   *   c: number(),
   * });
   *
   * @param schema
   * @param excludes
   */
  public shape(schemaShape: SchemaShape, excludes = []) {
    const next = this.clone()
    next.fields = Object.assign(next.fields, schemaShape)

    if (excludes.length) {
      // if (!Array.isArray(excludes[0])) {
      //   excludes = [excludes]
      // }
      const keys = excludes.map(([first, second]) => `${first}-${second}`)
      next._excludedEdges = next._excludedEdges.concat(keys)
    }

    next._nodes = sortFields(next.fields, next._excludedEdges)
    return next
  }

  /**
   * Transforms the specified key to a new key. If alias is true then the old key will be left.
   *
   * const schema = object({
   *   myProp: mixed(),
   *   Other: mixed(),
   * })
   *   .from('prop', 'myProp')
   *   .from('other', 'Other', true);
   *
   * inst.cast({ prop: 5, other: 6 }); // => { myProp: 5, other: 6, Other: 6 }
   *
   * @param from
   * @param to
   * @param alias
   */
  public from(from: string, to: string, alias?: boolean) {
    const fromGetter = getter(from, true)

    return this.transform(obj => {
      if (obj == null) {
        return obj
      }
      let newObj = obj
      if (has(obj, from)) {
        newObj = { ...obj }
        if (!alias) {
          delete newObj[from]
        }

        newObj[to] = fromGetter(obj)
      }

      return newObj
    })
  }

  /**
   * Validate that the object value only contains keys specified in shape, pass false as the first argument to
   * disable the check. Restricting keys to known, also enables stripUnknown option, when not in strict mode.
   *
   * @param noAllow
   * @param message
   */
  public noUnknown(noAllow = true, message = locale.object.noUnknown) {
    if (typeof noAllow === 'string') {
      message = noAllow
      noAllow = true
    }

    const next = this.test({
      exclusive: true,
      message,
      name: 'noUnknown',
      test(value) {
        return value == null || !noAllow || unknown(this.schema, value).length === 0
      },
    })

    if (noAllow) {
      next._options.stripUnknown = true
    }

    return next
  }

  public transformKeys(fn: (k: string) => string) {
    return this.transform(obj => obj && mapKeys(obj, (_, key) => fn(key)))
  }

  /**
   * Transforms all object keys to camelCase
   */
  public camelCase() {
    return this.transformKeys(camelCase)
  }

  /**
   * Transforms all object keys to snake_case.
   */
  public snakeCase() {
    return this.transformKeys(snakeCase)
  }

  /**
   * Transforms all object keys to CONSTANT_CASE.
   */
  public constantCase() {
    return this.transformKeys(key => snakeCase(key).toUpperCase())
  }

  public describe(): ObjectSchemaDescription {
    const desc: ObjectSchemaDescription = { ...super.describe(), fields: {} }
    for (const name of Object.keys(this.fields)) {
      const value = this.fields[name]
      desc.fields[name] = value.describe()
    }
    return desc
  }
}

export interface ObjectSchemaDescription extends SchemaDescription {
  fields: { [key: string]: SchemaDescription }
}
