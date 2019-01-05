export default class ValidationError extends Error {
  constructor(errors, value, field, type) {
    super()
    this.name = 'ValidationError'
    this.value = value
    this.path = field
    this.type = type
    this.errors = []
    this.inner = []

    if (errors) {
      ;[].concat(errors).forEach(err => {
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

ValidationError.isInstance = function(err) {
  return err && err.name === 'ValidationError'
}
