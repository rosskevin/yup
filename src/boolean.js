import MixedSchema from './MixedSchema'

export function boolean() {
  if (!(this instanceof BooleanSchema)) return new BooleanSchema()
  return this
}

export default class BooleanSchema extends MixedSchema {
  constructor() {
    super({ type: 'boolean' })

    this.withMutation(() => {
      this.transform(function(value) {
        if (!this.isType(value)) {
          if (/^(true|1)$/i.test(value)) return true
          if (/^(false|0)$/i.test(value)) return false
        }
        return value
      })
    })
  }

  _typeCheck(v) {
    if (v instanceof Boolean) v = v.valueOf()
    return typeof v === 'boolean'
  }
}
