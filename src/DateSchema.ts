import locale from './locale'
import { MixedSchema } from './MixedSchema'
import { Ref } from './Ref'
import isAbsent from './util/isAbsent'

const invalidDate = new Date('')

function isDate(obj: any) {
  const result = Object.prototype.toString.call(obj) === '[object Date]'
  return result
}

export function date() {
  return new DateSchema()
}

export class DateSchema extends MixedSchema {
  constructor() {
    super({ type: 'date' })

    this.withMutation(() => {
      this.transform(function(value) {
        if (this.isType(value)) {
          return value
        }

        const ms = Date.parse(value)
        const result = Number.isNaN(ms) === false ? new Date(ms) : invalidDate
        return result
      })
    })
  }

  public _typeCheck(v: any) {
    return isDate(v) && !isNaN(v.getTime())
  }

  public min(min: number, message = locale.date.min) {
    let limit = min

    if (!Ref.isRef(limit)) {
      limit = this.cast(min)
      if (!this._typeCheck(limit)) {
        throw new TypeError('`min` must be a Date or a value that can be `cast()` to a Date')
      }
    }

    return this.test({
      exclusive: true,
      message,
      name: 'min',
      params: { min },
      test(value) {
        return isAbsent(value) || value >= this.resolve(limit)
      },
    })
  }

  public max(max: number, message = locale.date.max) {
    let limit = max

    if (!Ref.isRef(limit)) {
      limit = this.cast(max)
      if (!this._typeCheck(limit)) {
        throw new TypeError('`max` must be a Date or a value that can be `cast()` to a Date')
      }
    }

    return this.test({
      exclusive: true,
      message,
      name: 'max',
      params: { max },
      test(value) {
        return isAbsent(value) || value <= this.resolve(limit)
      },
    })
  }
}
