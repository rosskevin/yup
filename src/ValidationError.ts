export default class ValidationError extends Error {
  public static isInstance(err: any): err is ValidationError {
    return err && err.name === 'ValidationError'
  }

  public name: string = 'ValidationError'
  public value: any
  public path: string
  public type?: string
  public errors: string[]
  public inner: ValidationError[]

  constructor(errors: ValidationError[], value: any, path: string, type?: string) {
    super()
    this.value = value
    this.path = path
    this.type = type
    this.errors = []
    this.inner = []

    if (errors) {
      const all: ValidationError[] = []
      all.concat(errors).forEach(err => {
        this.errors = this.errors.concat(err.errors || err)

        if (err.inner) {
          this.inner = this.inner.concat(err.inner.length ? err.inner : err)
        }
      })
    }

    this.message = this.errors.length > 1 ? `${this.errors.length} errors occurred` : this.errors[0]

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }
}
