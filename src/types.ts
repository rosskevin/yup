import { ArraySchema } from './ArraySchema'
import { BooleanSchema } from './BooleanSchema'
import { DateSchema } from './DateSchema'
import { LazySchema } from './LazySchema'
import { MixedSchema } from './MixedSchema'
import { NumberSchema } from './NumberSchema'
import { ObjectSchema } from './ObjectSchema'
import { StringSchema } from './StringSchema'
import { ValidationError } from './ValidationError'

export type AnyConcreteSchema =
  | MixedSchema
  | ArraySchema
  | DateSchema
  | NumberSchema
  | StringSchema
  | BooleanSchema
  | ObjectSchema

export type AnySchema = LazySchema | AnyConcreteSchema

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
