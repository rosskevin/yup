// tslint:disable:variable-name

import cloneDeepWith from 'lodash/cloneDeepWith'
import has from 'lodash/has'
import Condition from './Condition'
import { locale } from './locale'
import { Ref } from './Ref'
import {
  MutationFn,
  Schema,
  TestOptions,
  ValidateArgs,
  ValidateFn,
  ValidateOptions,
  WhenOptions,
} from './types'
import { AnyObject, BaseSchema, Message, SchemaDescription, TransformFunction } from './types'
import createValidation from './util/createValidation'
import getIn from './util/getIn'
import { isNotEmpty } from './util/isNotEmpty'
import { isSchema } from './util/isSchema'
import merge from './util/merge'
import printValue from './util/printValue'
import RefSet from './util/RefSet'
import runValidations from './util/runValidations'
import { ValidationError } from './ValidationError'

export function mixed(options = {}) {
  return new MixedSchema(options)
}

export class MixedSchema<T = any> implements Schema<T> {
  public __isYupSchema__ = true
  public _deps: Ref[] = []
  public _conditions: Array<Condition<T>> = []
  public _options: Partial<ValidateOptions> = { abortEarly: true, recursive: true } // FIXME appears sparingly used - at least in Mixed
  public _exclusive = Object.create(null)
  public _whitelist: RefSet = new RefSet()
  public _blacklist: RefSet = new RefSet()
  public tests: Array<ValidateFn<T>> = []
  public transforms: Array<TransformFunction<T>> = []
  public _defaultDefault: any
  public _type: string
  public _mutate: any
  public _meta: any
  public _nullable: boolean = false
  public _label: string | undefined = undefined
  public _typeError?: ValidateFn<T> = undefined
  public _whitelistError?: ValidateFn<T> = undefined
  public _blacklistError?: ValidateFn<T> = undefined
  public _default: any
  public _strip: boolean = false

  constructor(options: { default?: any; type?: string } = {}) {
    this.withMutation(() => {
      this.typeError(locale.mixed.notType)
    })

    if (has(options, 'default')) {
      this._defaultDefault = options.default
    }

    this._type = options.type || 'mixed'
  }

  /**
   * Creates a deep copy of the schema.
   * Clone is used internally to return a new schema with every schema state change.
   */
  public clone(): this {
    if (this._mutate) {
      return this
    }

    // if the nested value is a schema we can skip cloning, since
    // they are already immutable
    return cloneDeepWith(this, value => {
      if (isSchema(value) && value !== this) {
        return value
      }
      return undefined
    })
  }

  /**
   * Overrides the key name which is used in error messages.
   */
  public label(label: string) {
    const next = this.clone()
    next._label = label
    return next
  }

  /**
   *
   * Adds to a metadata object, useful for storing data with a schema, that doesn't belong the cast object itself.
   */
  public meta(obj?: AnyObject) {
    if (arguments.length === 0) {
      return this._meta
    }

    const next = this.clone()
    next._meta = Object.assign(next._meta || {}, obj)
    return next
  }

  /**
   * Allows you to mutate the schema in place, instead of the default behavior which clones before each change.
   * Generally this isn't necessary since the vast majority of schema changes happen during the initial declaration,
   * and only happen once over the lifetime of the schema, so performance isn't an issue.
   *
   * However certain mutations do occur at cast/validation time, (such as conditional schema using when()), or when
   * instantiating a schema object.
   *
   * @param mutationFn
   */
  public withMutation(mutationFn: MutationFn<T>) {
    this._mutate = true
    const result = mutationFn(this)
    this._mutate = false
    return result
  }

  /**
   * Creates a new instance of the schema by combining two schemas. Only schemas of the same type can be concatenated.
   */
  public concat(schema: Schema<T>): this {
    if (!schema) {
      return this
    }

    if (schema._type !== this._type && this._type !== 'mixed') {
      throw new TypeError(
        `You cannot \`concat()\` schema's of different types: ${this._type} and ${schema._type}`,
      )
    }
    const cloned = this.clone()
    let next: this = merge(this.clone(), schema.clone()) as any

    // undefined isn't merged over, but is a valid value for default
    if (has(schema, '_default')) {
      next._default = schema._default
    }

    next.tests = cloned.tests
    next._exclusive = cloned._exclusive

    // manually add the new tests to ensure
    // the deduping logic is consistent
    schema.tests.forEach(fn => {
      next = next.test((fn as any).TEST_OPTIONS)
    })

    next._type = schema._type

    return next
  }

  /**
   * Runs a type check against the passed in value. It returns true if it matches, it does not cast the value.
   * When nullable() is set null is considered a valid value of the type. You should use isType for all Schema type checks.
   *
   * @param v
   */
  public isType(v: any): v is T {
    if (this._nullable && v === null) {
      return true
    }
    return !(this as any)._typeCheck || (this as any)._typeCheck(v)
  }

  public resolve({ context, parent }: ValidateOptions): Schema<T> {
    if (this._conditions.length) {
      return this._conditions.reduce(
        (schema, match) => match.resolve(schema, match.getValue(parent, context)),
        this as Schema<T>, // initial value
      )
    }

    return this
  }

  /**
   * Attempts to coerce the passed in value to a value that matches the schema.
   * e.g. '5' -> 5 when using the number() type.
   *
   * @param value
   * @param options
   * @returns Failed casts generally return null, but may also return results like NaN and unexpected strings.
   */
  public cast(value: any, options: ValidateOptions = {}): T {
    const resolvedSchema = this.resolve(options)
    const result = resolvedSchema._cast(value, options)

    if (value !== undefined && options.assert !== false && resolvedSchema.isType(result) !== true) {
      const formattedValue = printValue(value)
      const formattedResult = printValue(result)
      throw new TypeError(
        `The value of ${options.path || 'field'} could not be cast to a value ` +
          `that satisfies the schema type: "${resolvedSchema._type}". \n\n` +
          `attempted value: ${formattedValue} \n` +
          (formattedResult !== formattedValue ? `result of cast: ${formattedResult}` : ''),
      )
    }

    return result
  }

  public _cast(rawValue: any, options: ValidateOptions = {}): any {
    let value =
      rawValue === undefined
        ? rawValue
        : this.transforms.reduce((v: any, fn) => fn.call(this, v, rawValue), rawValue)

    if (value === undefined && has(this, '_default')) {
      value = this.default()
    }

    return value
  }

  public _validate(_value: any, options: ValidateOptions = {}): Promise<T> {
    let value = _value
    const originalValue = options.originalValue != null ? options.originalValue : _value
    const isStrict = this._option('strict', options)
    const endEarly = this._option('abortEarly', options)
    const sync = options.sync || false
    const path = options.path as any // FIXME
    const label = this._label as any // FIXME

    if (!isStrict) {
      value = this._cast(value, { assert: false, ...options })
    }
    // value is cast, we can check if it meets type requirements
    const validateArgs: ValidateArgs<T> = {
      label,
      options,
      originalValue,
      path,
      schema: this,
      sync,
      value,
    }
    const prerequisiteValidations: Array<ValidateFn<T>> = []

    if (this._typeError) {
      prerequisiteValidations.push(this._typeError(validateArgs) as any) // FIXME this seems correct
    }

    if (this._whitelistError) {
      prerequisiteValidations.push(this._whitelistError(validateArgs) as any) // FIXME same as above
    }

    if (this._blacklistError) {
      prerequisiteValidations.push(this._blacklistError(validateArgs) as any) // FIXME same as above
    }

    // run prerequisites
    return runValidations({
      endEarly,
      path,
      sync,
      validations: prerequisiteValidations,
      value,
    }).then((v: any) =>
      // run provided validations
      runValidations({
        endEarly,
        path,
        sync,
        validations: this.tests.map(fn => fn(validateArgs)),
        value: v,
      }),
    )
  }

  /**
   * Returns the value (a cast value if isStrict is false) if the value is valid, and returns the errors otherwise.
   * This method is asynchronous and returns a Promise object, that is fulfilled with the value, or rejected with a
   * ValidationError.
   *
   * @param value
   * @param options object hash containing any schema options you may want to override (or specify for the first time).
   */
  public validate(value: any, options: ValidateOptions = {}) {
    const schema = this.resolve(options)
    return schema._validate(value, options)
  }

  /**
   * Runs validatations synchronously if possible and returns the resulting value, or throws a ValidationError.
   * Synchronous validation only works if there are no configured async tests, e.g tests that return a Promise.
   *
   * @param value
   * @param options  Accepts all the same options as validate.
   */
  public validateSync(value: any, options: ValidateOptions = {}): any {
    const schema = this.resolve(options)
    let result
    let err

    schema
      ._validate(value, { ...options, sync: true })
      .then((r: any) => (result = r))
      .catch((e: any) => (err = e))

    if (err) {
      throw err
    }
    return result
  }

  /**
   * Returns true when the passed in value matches the schema. isValid is asynchronous and returns a Promise object.
   *
   * @param value
   * @param options Takes the same options as validate().
   */
  public isValid(value: any, options?: ValidateOptions) {
    return this.validate(value, options)
      .then(() => true)
      .catch((err: any) => {
        if (ValidationError.isInstance(err)) {
          return false
        }
        throw err
      })
  }

  /**
   * Synchronously returns true when the passed in value matches the schema.
   *
   * @param value
   * @param options Takes the same options as validateSync() and has the same caveats around async tests.
   */
  public isValidSync(value: any, options?: ValidateOptions): value is T {
    try {
      this.validateSync(value, { ...options })
      return true
    } catch (err) {
      if (ValidationError.isInstance(err)) {
        return false
      }
      throw err
    }
  }

  public getDefault(options = {}) {
    const schema = this.resolve(options)
    return schema.default()
  }

  /**
   * Sets a default value to use when the value is undefined.
   *
   * Defaults are created after transformations are executed, but before validations, to help ensure that
   * safe defaults are specified. The default value will be cloned on each use, which can incur performance
   * penalty for objects and arrays. To avoid this overhead you can also pass a function that returns an new
   * default. Note that null is considered a separate non-empty value.
   *
   * yup.string.default('nothing');
   * yup.object.default({ number: 5 }); // object will be cloned every time a default is needed
   * yup.object.default(() => ({ number: 5 })); // this is cheaper
   * yup.date.default(() => new Date()); //also helpful for defaults that change over time
   *
   * @param value
   */
  public default(value: any): Schema<T> {
    const next = this.clone()
    next._default = value
    return next
  }

  /**
   * @returns the currrently set default value
   */
  public defaultValue(): T {
    const defaultValue = has(this, '_default') ? this._default : this._defaultDefault
    return typeof defaultValue === 'function'
      ? defaultValue.call(this)
      : cloneDeepWith(defaultValue)
  }

  /**
   * Sets the strict option to true. Strict schemas skip coercion and transformation attempts, validating the value "as is".
   */
  public strict() {
    const next = this.clone()
    next._options.strict = true
    return next
  }

  /**
   * Mark the schema as required. All field values apart from undefined and null meet this requirement.
   * @param message
   */
  public required(message = locale.mixed.required) {
    return this.test({ message, name: 'required', test: isNotEmpty })
  }

  /**
   * Mark the schema as not required. Passing undefined as value will not fail validation.
   */
  public notRequired() {
    const next = this.clone()
    next.tests = next.tests.filter(test => (test as any).TEST_OPTIONS.name !== 'required')
    return next
  }

  /**
   * Indicates that null is a valid value for the schema.
   * Without nullable() null is treated as a different type and will fail isType() checks.
   *
   * @param value
   */
  public nullable(value = true) {
    const next = this.clone()
    next._nullable = value === false ? false : true
    return next
  }

  /**
   * Adds a transformation to the transform chain. Transformations are central to the casting process, default transforms
   * for each type coerce values to the specific type (as verified by isType()). transforms are run before validations
   * and only applied when strict is true. Some types have built in transformations.
   *
   * Transformations are useful for arbitrarily altering how the object is cast, however, you should take care not to
   * mutate the passed in value. Transforms are run sequentially so each value represents the current state of the cast,
   * you can use the originalValue param if you need to work on the raw initial value.
   *
   * const schema = yup.string().transform(function(currentValue, originalvalue) {
   *   return this.isType(value) && value !== null ? value.toUpperCase() : value;
   * })
   *
   * schema.cast('jimmy'); //=> 'JIMMY'
   *
   * @param fn
   */
  public transform(fn: TransformFunction<T>): Schema<T> {
    const next: Schema<T> = this.clone()
    next.transforms.push(fn)
    return next
  }

  /**
   * Adds a test function to the schema's queue of tests.
   * tests can be exclusive or non-exclusive.
   *
   * - exclusive tests, will replace any existing tests of the same name.
   * - non-exclusive: can be stacked
   *
   * If a non-exclusive test is added to a schema with an exclusive test of the same name
   * the exclusive test is removed and further tests of the same name will be stacked.
   *
   * If an exclusive test is added to a schema with non-exclusive tests of the same name
   * the previous tests are removed and further tests of the same name will replace each other.
   *
   * -----------
   *
   * Adds a test function to the validation chain. Tests are run after any object is cast. Many types have some tests built
   * in, but you can create custom ones easily. In order to allow asynchronous custom validations all (or no) tests are
   * run asynchronously. A consequence of this is that test execution order cannot be guaranteed.
   *
   * All tests must provide a name, an error message and a validation function that must return true or false or a
   * ValidationError. To make a test async return a promise that resolves true or false or a ValidationError.
   * for the message argument you can provide a string which is will interpolate certain values if specified
   * using the ${param} syntax. By default all test messages are passed a path value which is valuable in nested schemas.
   *
   */
  public test(opts: TestOptions): this {
    // public test(...args) {
    //   let opts = args[0]
    //   if (args.length > 1) {
    //     let [name, message, test] = args
    //     if (test == null) {
    //       test = message
    //       message = locale.mixed.default
    //     }
    //     opts = { name, test, message, exclusive: false }
    //   }

    if (typeof opts.test !== 'function') {
      throw new TypeError('`test` is a required parameter')
    }

    const next = this.clone()
    const validate = createValidation<T>(opts)
    const isExclusive = opts.exclusive || (opts.name && next._exclusive[opts.name] === true)
    if (opts.exclusive && !opts.name) {
      throw new TypeError('Exclusive tests must provide a unique `name` identifying the test')
    }

    next._exclusive[opts.name] = !!opts.exclusive

    next.tests = next.tests.filter(fn => {
      if ((fn as any).TEST_OPTIONS.name === opts.name) {
        if (isExclusive) {
          return false
        }
        if ((fn as any).TEST_OPTIONS.test === (validate as any).TEST_OPTIONS.test) {
          return false
        }
      }
      return true
    })

    next.tests.push(validate)
    return next
  }

  /**
   * Adjust the schema based on a sibling or sibling children fields. You can provide an object literal where
   * the key `is` is value or a matcher function, then provides the true schema and/or otherwise for the failure
   * condition. `is` conditions are strictly compared (===) if you want to use a different form of equality
   * you can provide a function like: is: `(value) => value === true`.
   *
   * Like joi you can also prefix properties with $ to specify a property that is dependent on context passed
   * in by validate() or isValid. when conditions are additive.
   *
   *
   * const inst = yup.object({
   *   isBig: yup.boolean(),
   *   count: yup
   *     .number()
   *     .when('isBig', {
   *       is: true, // alternatively: (val) => val == true
   *       then: yup.number().min(5),
   *       otherwise: yup.number().min(0),
   *     })
   *     .when('$other', (other, schema) => (other === 4 ? schema.max(6) : schema)),
   * })
   *
   * inst.validate(value, { context: { other: 4 } });
   *
   * You can also specify more than one dependent key, in which case each value will be spread as an argument.
   *
   * const inst = yup.object({
   *       isSpecial: yup.boolean(),
   *       isBig: yup.boolean(),
   *       count: yup.number()
   *         .when(['isBig', 'isSpecial'], {
   *           is: true,  // alternatively: (isBig, isSpecial) => isBig && isSpecial
   *           then:      yup.number().min(5),
   *           otherwise: yup.number().min(0)
   *         })
   *     })
   *
   * inst.validate({
   *   isBig: true,
   *   isSpecial: true,
   *   count: 10
   * })
   *
   * Alternatively you can provide a function that returns a schema (called with the value of the key and the current schema).
   *
   * const inst = yup.object({
   *   isBig: yup.boolean(),
   *   count: yup.number().when('isBig', (isBig, schema) => {
   *     return isBig ? schema.min(5) : schema.min(0);
   *   }),
   * });
   *
   * inst.validate({ isBig: false, count: 4 });
   *
   * @param keys
   * @param options
   */
  public when(keys: string | string[], options: WhenOptions<T>): Schema<T> {
    const next = this.clone()
    const deps: Ref[] = ([] as string[]).concat(keys).map(key => new Ref(key))

    deps.forEach(dep => {
      if (!dep.isContext) {
        // next._deps.push(dep.key) FIXME changed
        next._deps.push(dep)
      }
    })

    next._conditions.push(new Condition<T>(deps, options))

    return next
  }

  /**
   * Define an error message for failed type checks.
   * The ${value} and ${type} interpolation can be used in the message argument.
   * @param message
   */
  public typeError(message: Message) {
    const next = this.clone()

    next._typeError = createValidation({
      message,
      name: 'typeError',
      test(value) {
        if (value !== undefined && !this.schema.isType(value)) {
          return this.createError({
            params: {
              type: this.schema._type,
            },
          })
        }
        return true
      },
    })
    return next
  }

  /**
   * Whitelist a set of values. Values added are automatically removed from any blacklist if they are in it.
   * The ${values} interpolation can be used in the message argument.
   *
   *  const schema = yup.mixed().oneOf(['jimmy', 42])
   *
   * @param values
   * @param message
   */
  public oneOf(values: any[], message: Message = locale.mixed.oneOf) {
    const next = this.clone()

    values.forEach(val => {
      next._whitelist.add(val)
      next._blacklist.delete(val)
    })

    next._whitelistError = createValidation({
      message,
      name: 'oneOf',
      test(value) {
        if (value === undefined) {
          return true
        }
        const valids = this.schema._whitelist

        return valids.has(value, this.resolve)
          ? true
          : this.createError({
              params: {
                values: valids.toArray().join(', '),
              },
            })
      },
    })

    return next
  }

  /**
   * Blacklist a set of values. Values added are automatically removed from any whitelist if they are in it.
   * The ${values} interpolation can be used in the message argument.
   *
   *  const schema = yup.mixed().notOneOf(['jimmy', 42])
   *
   * @param values
   * @param message
   */
  public notOneOf(values: any[], message = locale.mixed.notOneOf) {
    const next = this.clone()
    values.forEach(val => {
      next._blacklist.add(val)
      next._whitelist.delete(val)
    })

    next._blacklistError = createValidation({
      message,
      name: 'notOneOf',
      test(value) {
        const invalids = this.schema._blacklist
        if (invalids.has(value, this.resolve)) {
          return this.createError({
            params: {
              values: invalids.toArray().join(', '),
            },
          })
        }
        return true
      },
    })

    return next
  }

  /**
   * Marks a schema to be removed from an output object. Only works as a nested schema.
   * @param strip
   */
  public strip(strip = true) {
    const next = this.clone()
    next._strip = strip // FIXME why not next._options ???
    return next
  }

  public _option(key: string, overrides: ValidateOptions) {
    return has(overrides, key) ? overrides[key] : this._options[key]
  }

  /**
   * Collects schema details (like meta, labels, and active tests) into a serializable description object.
   */
  public describe(): SchemaDescription {
    const next = this.clone()

    return {
      label: next._label,
      meta: next._meta,
      tests: next.tests
        .map(fn => (fn as any).TEST_OPTIONS.name, {})
        .filter((n, idx, list) => list.indexOf(n) === idx),
      type: next._type,
    }
  }

  /**
   * Validate a deeply nested path within the schema. Similar to how reach works,
   * but uses the resulting schema as the subject for validation.
   *
   * Note! The value here is the root value relative to the starting schema, not the value at the nested path.
   */
  public validateAt(path: string, value: any, options: ValidateOptions = {}): Promise<T> {
    const { parent, parentPath, schema } = getIn(this, path, value, options.context)

    return this.validate(parent && parentPath ? parent[parentPath] : undefined, {
      ...options,
      parent,
      path,
    })
  }

  /**
   * Validate a deeply nested path within the schema. Similar to how reach works, but uses the resulting schema as the subject
   * for validation.
   *
   * Note! The value here is the root value relative to the starting schema, not the value at the nested path.
   */
  public validateSyncAt(path: string, value: any, options: ValidateOptions = {}): T {
    const { parent, parentPath, schema } = getIn(this, path, value, options.context)

    return this.validateSync(parent && parentPath ? parent[parentPath] : undefined, {
      ...options,
      parent,
      path,
    })
  }
}

for (const alias of ['equals', 'is']) {
  MixedSchema.prototype[alias] = MixedSchema.prototype.oneOf
}
for (const alias of ['not', 'nope']) {
  MixedSchema.prototype[alias] = MixedSchema.prototype.notOneOf
}
