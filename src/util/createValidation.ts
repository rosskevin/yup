import mapValues from 'lodash/mapValues'
import { SynchronousPromise } from 'synchronous-promise'
import { Ref } from '../Ref'
import {
  CreateErrorArgs,
  Schema,
  TestContext,
  TestOptions,
  ValidateArgs,
  ValidateFn,
  ValidateOptions,
} from '../types'
import ValidationError from '../ValidationError'
import formatError from './formatError'

function isPromiseLike(p: any): p is PromiseLike<any> {
  return p && typeof p.then === 'function' && typeof p.catch === 'function'
}

function runTest<S>(testOptions: TestOptions, ctx: TestContext, validateArgs: ValidateArgs<S>) {
  const { test: testFn } = testOptions
  const { value, sync } = validateArgs
  const result = testFn.call(ctx, value)
  if (!sync) {
    return Promise.resolve(result)
  }

  if (isPromiseLike(result)) {
    throw new Error(
      `Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. ` +
        `This test will finish after the validate call has returned`,
    )
  }
  return SynchronousPromise.resolve(result)
}

type Resolve = (r: any) => any

function resolveParams(oldParams: object, newParams: object, resolve: Resolve) {
  return mapValues({ ...oldParams, ...newParams }, resolve)
}

function createErrorFactory(
  testOptions: TestOptions,
  validateArgs: ValidateArgs<any>,
  resolve: Resolve,
) {
  // const { message, name, params } = testOptions
  const { value, label, originalValue } = validateArgs
  return function createError({
    path = validateArgs.path,
    message = testOptions.message,
    type = testOptions.name,
    params,
  }: CreateErrorArgs = {}) {
    params = {
      label,
      originalValue,
      path,
      value,
      ...resolveParams(testOptions.params || {}, params, resolve),
    }

    return Object.assign(
      new ValidationError(formatError(message as string, params) as string, value, path, type),
      {
        params,
      },
    )
  }
}

export default function createValidation<T>(testOptions: TestOptions): ValidateFn<T> {
  const { name, message, test, params } = testOptions

  function validate(validateArgs: ValidateArgs<T>) {
    const { value, path, label, options, originalValue, sync, ...rest } = validateArgs
    const parent = options.parent // save here - it seems to be mutated later
    const resolve = (r: any) => (Ref.isRef(r) ? r.getValue(parent, options.context) : r)

    const createError = createErrorFactory(testOptions, validateArgs, resolve)

    const ctx: TestContext = {
      createError,
      options,
      parent,
      path,
      resolve,
      type: name,
      ...rest,
    }

    return runTest(testOptions, ctx, validateArgs).then(validOrError => {
      if (ValidationError.isInstance(validOrError)) {
        throw validOrError
      } else if (!validOrError) {
        throw createError()
      }
    })
  }

  validate.TEST_OPTIONS = testOptions
  return validate
}
