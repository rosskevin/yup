// tslint:disable:ban-types

import { ArraySchema } from './ArraySchema'
import { BooleanSchema } from './BooleanSchema'
import Condition from './Condition'
import { DateSchema } from './DateSchema'
import { LazySchema } from './LazySchema'
import { MixedSchema } from './MixedSchema'
import { NumberSchema } from './NumberSchema'
import { ObjectSchema } from './ObjectSchema'
import { Ref } from './Ref'
import { StringSchema } from './StringSchema'
import RefSet from './util/RefSet'
import { ValidationError } from './ValidationError'

export type AnySchema =
  | LazySchema
  | MixedSchema
  | ArraySchema
  | DateSchema
  | NumberSchema
  | StringSchema
  | BooleanSchema
  | ObjectSchema

export interface AnyObject {
  [key: string]: any
}

export interface Params {
  path: string
  label?: string
}

export interface ValidateOptions {
  /**
   * Only validate the input, and skip and coercion or transformation. Default - false
   */
  strict?: boolean
  /**
   * Teturn from validation methods on the first error rather than after all validations run. Default - true
   */
  abortEarly?: boolean
  /**
   * Remove unspecified keys from objects. Default - false
   */
  stripUnknown?: boolean
  /**
   * When false validations will not descend into nested schema (relevant for objects or arrays). Default - true
   */
  recursive?: boolean
  /**
   * Any context needed for validating schema conditions (see: when())
   */
  context?: AnyObject
  parent?: AnyObject //  FIXME found in createValidation and validateAt
  path?: string // FIXME found in validateAt
  originalValue?: any // FIXME _validate after typed, try commenting out
  sync?: boolean // found in _validate
  assert?: boolean // found in mixed.cast
  __validating?: boolean // found in ObjectSchema
}

export interface ValidateArgs<T, S extends MixedSchema<T> = MixedSchema<T>> {
  label: string
  options: ValidateOptions
  originalValue: any
  path: string
  schema: S
  sync: boolean
  value: any
}

export type ValidateFn<T> = (args: ValidateArgs<T>) => Promise<void>

/*
export interface WhenOptionsFns<T> {
  (value: any, schema: T): T
  (v1: any, v2: any, schema: T): T
  (v1: any, v2: any, v3: any, schema: T): T
  (v1: any, v2: any, v3: any, v4: any, schema: T): T
}
*/

export interface SchemaDescription {
  // fields: AnyObject
  label?: string
  meta: AnyObject
  tests: string[]
  type: string
  innerType?: SchemaDescription
}

export type TransformFunction<T, S extends MixedSchema<T> = MixedSchema<T>> = ((
  this: S,
  value: any,
  originalValue: any,
) => any)

export type MutationFn<T, S extends MixedSchema<T> = MixedSchema<T>> = (current: S) => void

// export interface BaseSchema<T, S extends MixedSchema<T> = MixedSchema<T>> {
//   _type: string // try moving this back down toSchema
//   cast(value: any, options?: ValidateOptions): T

//   describe(): SchemaDescription
//   resolve(options: ValidateOptions): S // Schema<T>
//   validate(value: any, options?: ValidateOptions): Promise<T>
// }
//
// export interface Schema<T> extends BaseSchema<T> {
//   _default: any
//   tests: Array<ValidateFn<T>> // FIXME rename to validations
//   _exclusive: any
//   _label: string | undefined
//   _meta: any
//   // _deps: Ref[]
//   transforms: Array<TransformFunction<T>>
//   _options: Partial<ValidateOptions>
//   _nullable: boolean
//   _conditions: Array<Condition<T>>
//   _typeError?: ValidateFn<T>
//   _whitelist: RefSet
//   _blacklist: RefSet
//   _whitelistError?: ValidateFn<T>
//   _blacklistError?: ValidateFn<T>
//   /**
//    * `undefined` specifically means uninitialized, as opposed to "no subtype"
//    */
//   itemSchema?: BaseSchema<T>
//   // fields: AnyObject
//   _strip: boolean
//   _cast(rawValue: any, options?: ValidateOptions): any
//   clone(): this
//   concat(schema: Schema<T>): this
//   default(value: any): this
//   defaultValue(): T
//   isType(value: any): value is T
//   isValid(value: any, options?: ValidateOptions): Promise<boolean>
//   isValidSync(value: any, options?: ValidateOptions): value is T
//   label(label: string): this
//   meta(metadata?: AnyObject): this
//   notOneOf(values: any[], message?: Message): this
//   notRequired(): this
//   nullable(isNullable: boolean): this
//   oneOf(values: any[], message?: Message): this
//   required(message?: Message): this
//   strict(): this
//   strip(strip?: boolean): this
//   test(options: TestOptions): this
//   // test(
//   //   name: string,
//   //   message: string | ((params: AnyObject & Partial<TestMessageParams>) => string),
//   //   test: (
//   //     this: TestContext,
//   //     value?: any,
//   //   ) => boolean | ValidationError | Promise<boolean | ValidationError>,
//   //   callbackStyleAsync?: boolean,
//   // ): this
//   transform(fn: TransformFunction<T>): this
//   typeError(message?: Message): this
//   _validate(value: any, options: ValidateOptions): Promise<T>
//   validateAt(path: string, value: T, options?: ValidateOptions): Promise<T>
//   validateSync(value: any, options?: ValidateOptions): any
//   validateSyncAt(path: string, value: T, options?: ValidateOptions): T
//   // when(keys: string | string[], options: WhenOptions<T>): this
//   withMutation(fn: MutationFn<T>): void
// }

export interface CreateErrorArgs {
  path?: string
  message?: Message
  type?: string
  params?: any
}

export interface TestContext<T = any, S extends MixedSchema<T> = MixedSchema<T>> {
  createError: (args: CreateErrorArgs) => ValidationError
  options: ValidateOptions
  parent: any
  path: string
  resolve: (value: any) => any
  schema: S
  type?: string
}

export interface TestMessageParams {
  label: string
  originalValue: any
  path: string
  value: any
}

export interface LocaleFnArgs {
  path: string
  type: string
  value: any
  originalValue: any
}
export type LocaleFn = (args: LocaleFnArgs) => string

export interface MessageFormatterParams extends Partial<TestMessageParams> {
  [key: string]: any //  FIXME open params? I think this sholud be merged with LocaleFn
}
export type MessageFormatter = (params: MessageFormatterParams) => string
export type Message = string | MessageFormatter | LocaleFn

export interface TestOptions {
  /**
   * Unique name identifying the test
   */
  name: string

  /**
   * Test function, determines schema validity
   */
  test: (
    this: TestContext,
    value: any,
  ) => boolean | ValidationError | Promise<boolean | ValidationError>

  /**
   * The validation error message
   */
  message?: Message

  /**
   * Values passed to message for interpolation
   */
  params?: AnyObject

  /**
   * Mark the test as exclusive, meaning only one of the same can be active at once
   */
  exclusive?: boolean
}
