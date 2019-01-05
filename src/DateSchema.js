import { MixedSchema } from './MixedSchema'
import locale from './locale'
import isAbsent from './util/isAbsent'
import Ref from './util/Ref'

let invalidDate = new Date('')

function isDate(obj) {
  const result = Object.prototype.toString.call(obj) === '[object Date]'
  return result
}

export function date() {
  if (!(this instanceof DateSchema)) return new DateSchema()
  return this
}

export class DateSchema extends MixedSchema {
  constructor() {
    super({ type: 'date' })

    this.withMutation(() => {
      this.transform(function(value) {
        if (this.isType(value)) return value

        const ms = Date.parse(value)
        const result = Number.isNaN(ms) === false ? new Date(ms) : invalidDate
        return result
      })
    })
  }

  _typeCheck(v) {
    return isDate(v) && !isNaN(v.getTime())
  }

  min(min, message = locale.date.min) {
    var limit = min

    if (!Ref.isRef(limit)) {
      limit = this.cast(min)
      if (!this._typeCheck(limit))
        throw new TypeError('`min` must be a Date or a value that can be `cast()` to a Date')
    }

    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value >= this.resolve(limit)
      },
    })
  }

  max(max, message = locale.date.max) {
    var limit = max

    if (!Ref.isRef(limit)) {
      limit = this.cast(max)
      if (!this._typeCheck(limit))
        throw new TypeError('`max` must be a Date or a value that can be `cast()` to a Date')
    }

    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value <= this.resolve(limit)
      },
    })
  }
}
