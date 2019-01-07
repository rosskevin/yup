import { SynchronousPromise } from 'synchronous-promise'
import ValidationError from '../ValidationError'

function promise<T>(sync: boolean): Promise<T> {
  return sync ? (SynchronousPromise as any) : Promise
}

function unwrapError(errors: ValidationError | ValidationError[] = []) {
  if (ValidationError.isInstance(errors)) {
    return errors.inner
  } else {
    const all: ValidationError[] = []
    return all.concat(errors)
  }
}

function scopeToValue<T>(promises: Array<T | PromiseLike<T>>, value: any, sync: boolean) {
  // Promise.all
  // console.log('scopeToValue', promises, value)
  const p = (promise<T>(sync) as any).all(promises) // FIXME - not sure

  // console.log('scopeToValue B', p)

  const b = p.catch((err: Error) => {
    if (ValidationError.isInstance(err)) {
      err.value = value
    }
    throw err
  })
  // console.log('scopeToValue c', b)
  const c = b.then(() => value)
  // console.log('scopeToValue d', c)
  return c
}

export function settled<T>(promises: Array<T | PromiseLike<T>>, sync: boolean) {
  const settle = (promiseInner: Promise<T>) =>
    promiseInner.then(value => ({ fulfilled: true, value }), value => ({ fulfilled: false, value }))

  return (promise(sync) as any).all(promises.map(settle as any)) // FIXME
}

function collectErrors({ validations, value, path, sync, errors, sort }: any) {
  errors = unwrapError(errors)
  return settled(validations, sync).then((results: any) => {
    const nestedErrors = results
      .filter((r: any) => !r.fulfilled)
      .reduce((arr: any, { value: error }: any) => {
        // we are only collecting validation errors
        if (!ValidationError.isInstance(error)) {
          throw error
        }
        return arr.concat(error)
      }, [])

    if (sort) {
      nestedErrors.sort(sort)
    }

    // show parent errors after the nested ones: name.first, name
    errors = nestedErrors.concat(errors)

    if (errors.length) {
      throw new ValidationError(errors, value, path)
    }

    return value
  })
}

export default function runValidations({ endEarly, ...options }: any) {
  if (endEarly) {
    return scopeToValue(options.validations, options.value, options.sync)
  }

  return collectErrors(options)
}
