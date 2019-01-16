import { MixedSchema } from '../../MixedSchema'

const g = global as any

if (g.YUP_USE_SYNC) {
  const { validate } = MixedSchema.prototype

  MixedSchema.prototype.validate = function(value: any, options: any = {}) {
    options.sync = true
    return validate.call(this, value, options)
  }
}

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err: any) => {
  throw err
})
