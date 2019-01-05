export default class ValidationError extends Error {
  public static isInstance(err: any): err is ValidationError {
    return err && err.name === 'ValidationError'
  }

  public readonly name: string = 'ValidationError'
  public value: any
  public path: string
  public type?: string
  public errors: Array<ValidationError | string>
  public inner: Array<ValidationError | string>

  constructor(errors: string | ValidationError, value: any, path: string, type?: string) {
    super()
    this.value = value
    this.path = path
    this.type = type
    this.errors = []
    this.inner = []

    if (errors) {
      const all: Array<ValidationError | string> = []
      all.concat(errors).forEach(err => {
        this.errors = this.errors.concat((err as any).errors || err)

        if (ValidationError.isInstance(err)) {
          this.inner = this.inner.concat(err.inner.length ? err.inner : err)
        }
      })
    }

    this.message =
      this.errors.length > 1 ? `${this.errors.length} errors occurred` : (this.errors[0] as string)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }
}
