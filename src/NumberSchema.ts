import { locale } from './locale'
import { MixedSchema } from './MixedSchema'
import { isAbsent } from './util/isAbsent'

const ROUND_METHODS = ['ceil', 'floor', 'round', 'trunc']

function isNaN(value: any) {
  return value !== +value
}

function isInteger(val: any) {
  // tslint:disable-next-line:no-bitwise
  return isAbsent(val) || val === (val | 0)
}

export function number() {
  return new NumberSchema()
}

export class NumberSchema extends MixedSchema {
  constructor() {
    super({ type: 'number' })

    this.withMutation(() => {
      this.transform(function(value) {
        let parsed = value

        if (typeof parsed === 'string') {
          parsed = parsed.replace(/\s/g, '')
          if (parsed === '') {
            return NaN
          }
          // don't use parseFloat to avoid positives on alpha-numeric strings
          parsed = +parsed
        }

        if (this.isType(parsed)) {
          return parsed
        }

        return parseFloat(parsed)
      })
    })
  }
  public _typeCheck(value: any) {
    if (value instanceof Number) {
      value = value.valueOf()
    }

    return typeof value === 'number' && !isNaN(value)
  }

  public min(min: number, message = locale.number.min) {
    return this.test({
      exclusive: true,
      message,
      name: 'min',
      params: { min },
      test(value) {
        return isAbsent(value) || value >= this.resolve(min)
      },
    })
  }

  public max(max: number, message = locale.number.max) {
    return this.test({
      exclusive: true,
      message,
      name: 'max',
      params: { max },
      test(value) {
        return isAbsent(value) || value <= this.resolve(max)
      },
    })
  }

  public lessThan(less: number, message = locale.number.lessThan) {
    return this.test({
      exclusive: true,
      message,
      name: 'max',
      params: { less },
      test(value) {
        return isAbsent(value) || value < this.resolve(less)
      },
    })
  }

  public moreThan(more: number, message = locale.number.moreThan) {
    return this.test({
      exclusive: true,
      message,
      name: 'min',
      params: { more },
      test(value) {
        return isAbsent(value) || value > this.resolve(more)
      },
    })
  }

  public positive(msg = locale.number.positive) {
    return this.min(0, msg)
  }

  public negative(msg = locale.number.negative) {
    return this.max(0, msg)
  }

  public integer(message = locale.number.integer) {
    return this.test({ name: 'integer', message, test: isInteger })
  }

  public truncate() {
    // tslint:disable-next-line:no-bitwise
    return this.transform(value => (!isAbsent(value) ? value | 0 : value))
  }

  public round(methodArg?: 'ceil' | 'floor' | 'round' | 'trunc') {
    const method = (methodArg && methodArg.toLowerCase()) || 'round'

    // this exists for symemtry with the new Math.trunc
    if (method === 'trunc') {
      return this.truncate()
    }

    if (ROUND_METHODS.indexOf(method.toLowerCase()) === -1) {
      throw new TypeError('Only valid options for round() are: ' + ROUND_METHODS.join(', '))
    }

    return this.transform(value => (!isAbsent(value) ? Math[method](value) : value))
  }
}
