import { ValidationError } from '../ValidationError'

/**
 * If not failing on the first error, catch the errors
 * and collect them in an array
 */
export default function propagateErrors(endEarly: boolean, errors: ValidationError[]) {
  return endEarly
    ? null
    : (err: ValidationError) => {
        errors.push(err)
        return err.value
      }
}
