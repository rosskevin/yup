import MixedSchema from './MixedSchema'
import locale from './locale'
import isAbsent from './util/isAbsent'

let isNaN = value => value != +value

let isInteger = val => isAbsent(val) || val === (val | 0)

export function number() {
  if (!(this instanceof NumberSchema)) return new NumberSchema()
  return this
}

export default class NumberSchema extends MixedSchema {
  constructor() {
    super({ type: 'number' })

    this.withMutation(() => {
      this.transform(function(value) {
        let parsed = value

        if (typeof parsed === 'string') {
          parsed = parsed.replace(/\s/g, '')
          if (parsed === '') return NaN
          // don't use parseFloat to avoid positives on alpha-numeric strings
          parsed = +parsed
        }

        if (this.isType(parsed)) return parsed

        return parseFloat(parsed)
      })
    })
  }
  _typeCheck(value) {
    if (value instanceof Number) value = value.valueOf()

    return typeof value === 'number' && !isNaN(value)
  }

  min(min, message = locale.number.min) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value >= this.resolve(min)
      },
    })
  }

  max(max, message = locale.number.max) {
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value <= this.resolve(max)
      },
    })
  }

  lessThan(less, message = locale.number.lessThan) {
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { less },
      test(value) {
        return isAbsent(value) || value < this.resolve(less)
      },
    })
  }

  moreThan(more, message = locale.number.moreThan) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { more },
      test(value) {
        return isAbsent(value) || value > this.resolve(more)
      },
    })
  }

  positive(msg = locale.number.positive) {
    return this.min(0, msg)
  }

  negative(msg = locale.number.negative) {
    return this.max(0, msg)
  }

  integer(message = locale.number.integer) {
    return this.test({ name: 'integer', message, test: isInteger })
  }

  truncate() {
    return this.transform(value => (!isAbsent(value) ? value | 0 : value))
  }

  round(method) {
    var avail = ['ceil', 'floor', 'round', 'trunc']
    method = (method && method.toLowerCase()) || 'round'

    // this exists for symemtry with the new Math.trunc
    if (method === 'trunc') return this.truncate()

    if (avail.indexOf(method.toLowerCase()) === -1)
      throw new TypeError('Only valid options for round() are: ' + avail.join(', '))

    return this.transform(value => (!isAbsent(value) ? Math[method](value) : value))
  }
}
