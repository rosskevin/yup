// tslint:disable:ban-types
export type Value = any // number | string | Function | null | boolean | Date

const toString = Object.prototype.toString
const errorToString = Error.prototype.toString
const regExpToString = RegExp.prototype.toString
const symbolToString = typeof Symbol !== 'undefined' ? Symbol.prototype.toString : () => ''

const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/

function printNumber(val: number): string {
  if (val !== +val) {
    return 'NaN'
  }
  const isNegativeZero = val === 0 && 1 / val < 0
  return isNegativeZero ? '-0' : '' + val
}

function printSimpleValue(val: Value, quoteStrings = false): string | null {
  if (val === null || val === true || val === false) {
    return '' + val
  }

  const typeOf = typeof val
  if (typeOf === 'number') {
    return printNumber(val as number)
  }
  if (typeOf === 'string') {
    return quoteStrings ? `"${val}"` : (val as string)
  }
  if (typeOf === 'function') {
    // tslint:disable-next-line:ban-types
    return '[Function ' + ((val as Function).name || 'anonymous') + ']'
  }
  if (typeOf === 'symbol') {
    return symbolToString.call(val).replace(SYMBOL_REGEXP, 'Symbol($1)')
  }

  const tag = toString.call(val).slice(8, -1)
  if (tag === 'Date') {
    return isNaN((val as Date).getTime()) ? '' + val : (val as Date).toISOString()
  }
  if (tag === 'Error' || val instanceof Error) {
    return '[' + errorToString.call(val) + ']'
  }
  if (tag === 'RegExp') {
    return regExpToString.call(val)
  }

  return null
}

export default function printValue(value: Value, quoteStrings: boolean = false): string {
  const result = printSimpleValue(value, quoteStrings)
  if (result !== null) {
    return result
  }

  return JSON.stringify(
    value,
    (k, v) => {
      // const psv = printSimpleValue(this[key], quoteStrings) // old
      const psv = printSimpleValue(v, quoteStrings)
      if (psv !== null) {
        return psv
      }
      return v
    },
    2,
  )
}
