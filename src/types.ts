// tslint:disable:ban-types

import Condition from './Condition'
import { Ref } from './Ref'
import RefSet from './util/RefSet'
import ValidationError from './ValidationError'

export interface AnyObject {
  [key: string]: any
}

export type Value = number | string | Function | null | boolean | Date

export interface Params {
  path: string
  label?: string
}

export interface AsyncValidateOptions {
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
}

/**
 * most of these seen in _validate, not sure why not exposed externally
 */
export interface ValidateOptions extends AsyncValidateOptions {
  originalValue?: any // FIXME _validate after typed, try commenting out
  sync?: boolean // found in _validate
  assert?: boolean // found in mixed.cast
}

export interface ValidateArgs<T> {
  label: string
  options: ValidateOptions
  originalValue: any
  path: string
  schema: Schema<T>
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

export type WhenIsFn = (values: any[]) => boolean

export type WhenOptionsFn<T> = (values: any[], schema: Schema<T>) => Schema<T>

export interface WhenOptionsObject<T> {
  is: boolean | WhenIsFn
  then: Schema<T>
  otherwise: Schema<T>
}

export type WhenOptions<T> = WhenOptionsFn<T> | WhenOptionsObject<T>

export interface SchemaDescription {
  // fields: AnyObject
  label?: string
  meta: AnyObject
  tests: string[]
  type: string
}

export type TransformFunction<T> = ((this: Schema<T>, value: any, originalValue: any) => any)

export type MutationFn<T> = (current: Schema<T>) => void

export interface Schema<T> {
  _type: string
  _default: any
  tests: Array<ValidateFn<T>> // FIXME rename to validations
  _exclusive: any
  _label: string | undefined
  _meta: any
  _deps: Ref[]
  transforms: Array<TransformFunction<T>>
  _options: Partial<ValidateOptions>
  _nullable: boolean
  _conditions: Array<Condition<T>>
  _typeError?: ValidateFn<T>
  _whitelist: RefSet
  _blacklist: RefSet
  _whitelistError?: ValidateFn<T>
  _blacklistError?: ValidateFn<T>
  _subType?: Schema<T>
  fields: AnyObject
  _strip: boolean
  clone(): Schema<T>
  label(label: string): Schema<T>
  meta(metadata?: AnyObject): Schema<T>
  withMutation(fn: MutationFn<T>): void
  concat(schema: Schema<T>): Schema<T>
  test(options: TestOptions): Schema<T>
  isType(value: any): value is T
  resolve(options: ValidateOptions): Schema<T>
  cast(value: any, options?: ValidateOptions): T
  _cast(rawValue: any, options?: ValidateOptions): any
  default(value?: any): Schema<T>
  when(keys: string | string[], options: WhenOptions<T>): Schema<T>
  validate(value: any, options?: AsyncValidateOptions): Promise<T>
  _validate(value: any, options: ValidateOptions): Promise<T>
  validateSync(value: any, options?: ValidateOptions): any
  transform(fn: TransformFunction<T>): Schema<T>
  nullable(isNullable: boolean): Schema<T>
  typeError(message?: Message): Schema<T>
  oneOf(values: any[], message?: Message): Schema<T>
  notOneOf(values: any[], message?: Message): Schema<T>
  // type: string
  describe(): SchemaDescription
  validateAt(path: string, value: T, options?: ValidateOptions): Promise<T>
  validateSyncAt(path: string, value: T, options?: ValidateOptions): T
  isValid(value: any, options?: any): Promise<boolean>
  isValidSync(value: any, options?: any): value is T
  strict(): Schema<T>
  strip(strip?: boolean): Schema<T>
  required(message?: Message): Schema<T>
  notRequired(): Schema<T>
  // test(
  //   name: string,
  //   message: string | ((params: AnyObject & Partial<TestMessageParams>) => string),
  //   test: (
  //     this: TestContext,
  //     value?: any,
  //   ) => boolean | ValidationError | Promise<boolean | ValidationError>,
  //   callbackStyleAsync?: boolean,
  // ): this
}

export interface CreateErrorArgs {
  path?: string
  message?: Message
  type?: string
  params?: any
}

export interface TestContext {
  createError: (args: CreateErrorArgs) => ValidationError
  options: ValidateOptions
  parent: any
  path: string
  resolve: (value: any) => any
  schema: Schema<any>
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
  [key: string]: any // open params?
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
