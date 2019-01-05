// tslint:disable:ban-types

import { resolve } from 'dns'
import ValidationError from './ValidationError'

export type Value = number | string | Function | null | boolean | Date

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
  context?: object

  /**
   * found in createValidation
   */
  parent?: object
}

export interface WhenOptionsBuilder<T> {
  (value: any, schema: T): T
  (v1: any, v2: any, schema: T): T
  (v1: any, v2: any, v3: any, schema: T): T
  (v1: any, v2: any, v3: any, v4: any, schema: T): T
}

export type WhenOptions<T> =
  | WhenOptionsBuilder<T>
  | { is: boolean | ((value: any) => boolean); then: any; otherwise: any }
  | object

export interface SchemaDescription {
  fields: object
  label: string
  meta: object
  tests: string[]
  type: string
}

export type TransformFunction<T> = ((this: T, value: any, originalValue: any) => any)

export interface Schema<T> {
  fields: { [key: string]: any }
  type: string
  _subType: this
  clone(): this
  label(label: string): this
  meta(metadata: any): this
  meta(): any
  describe(): SchemaDescription
  concat(schema: this): this
  validate(value: any, options?: ValidateOptions): Promise<T>
  validateSync(value: any, options?: ValidateOptions): T
  validateAt(path: string, value: T, options?: ValidateOptions): Promise<T>
  validateSyncAt(path: string, value: T, options?: ValidateOptions): T
  isValid(value: any, options?: any): Promise<boolean>
  isValidSync(value: any, options?: any): value is T
  cast(value: any, options?: any): T
  isType(value: any): value is T
  strict(isStrict: boolean): this
  strip(strip: boolean): this
  withMutation(fn: (current: this) => void): void
  default(value?: any): this
  nullable(isNullable: boolean): this
  required(message?: Message): this
  resolve(args: any): this
  notRequired(): this
  typeError(message?: Message): this
  oneOf(arrayOfValues: any[], message?: Message): this
  notOneOf(arrayOfValues: any[], message?: Message): this
  when(keys: string | any[], builder: WhenOptions<this>): this
  test(
    name: string,
    message: string | ((params: object & Partial<TestMessageParams>) => string),
    test: (
      this: TestContext,
      value?: any,
    ) => boolean | ValidationError | Promise<boolean | ValidationError>,
    callbackStyleAsync?: boolean,
  ): this
  test(options: TestOptions): this
  transform(fn: TransformFunction<this>): this
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

export interface MessageFormatterParams extends Partial<TestMessageParams> {
  [key: string]: any // open params?
}
export type MessageFormatter = (params: MessageFormatterParams) => string
export type Message = string | MessageFormatter

export interface TestOptions {
  /**
   * Unique name identifying the test
   */
  name?: string

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
  params?: object

  /**
   * Mark the test as exclusive, meaning only one of the same can be active at once
   */
  exclusive?: boolean
}
