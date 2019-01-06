import { AnyObject } from '../types'
/**
 * Based on Kendo UI Core expression code <https://github.com/telerik/kendo-ui-core#license-information>
 */
class Cache {
  public size: number = 0
  private maxSize: number
  private values: AnyObject = {}

  constructor(maxSize: number) {
    this.maxSize = maxSize
    this.clear()
  }

  public clear() {
    this.size = 0
    this.values = {}
  }

  public get(key: string) {
    return this.values[key]
  }

  public set(key: string, value: any) {
    if (this.size >= this.maxSize) {
      this.clear()
    }
    if (!this.values.hasOwnProperty(key)) {
      this.size++
    }
    return (this.values[key] = value)
  }
}

const SPLIT_REGEX = /[^.^\]^[]+|(?=\[\]|\.\.)/g
const DIGIT_REGEX = /^\d+$/
const LEAD_DIGIT_REGEX = /^\d/
const SPEC_CHAR_REGEX = /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g
const CLEAN_QUOTES_REGEX = /^\s*(['"]?)(.*?)(\1)\s*$/
const MAX_CACHE_SIZE = 512

let contentSecurityPolicy = false
const pathCache = new Cache(MAX_CACHE_SIZE)
const setCache = new Cache(MAX_CACHE_SIZE)
const getCache = new Cache(MAX_CACHE_SIZE)

try {
  // tslint:disable-next-line
  new Function('')
} catch (error) {
  contentSecurityPolicy = true
}

const setter = contentSecurityPolicy
  ? (path: string) => {
      const parts = normalizePath(path)
      return (data: any, value: any) => {
        return setterFallback(parts, data, value)
      }
    }
  : (path: string) => {
      return (
        setCache.get(path) ||
        // tslint:disable-next-line:function-constructor
        setCache.set(path, new Function('data, value', expr(path, 'data') + ' = value'))
      )
    }

const getter = contentSecurityPolicy
  ? (path: string, safe: boolean = false) => {
      const parts = normalizePath(path)
      return (data: any) => {
        return getterFallback(parts, safe, data)
      }
    }
  : (path: string, safe: boolean = false) => {
      const key = path + '_' + safe
      return (
        getCache.get(key) ||
        // tslint:disable-next-line:function-constructor
        getCache.set(key, new Function('data', 'return ' + expr(path, safe, 'data')))
      )
    }

function join(segments: any[]) {
  return segments.reduce((path: string, part: string) => {
    return (
      path +
      (isQuoted(part) || DIGIT_REGEX.test(part) ? '[' + part + ']' : (path ? '.' : '') + part)
    )
  }, '')
}

function setterFallback(parts: string[], data: any, value: any) {
  let index = 0
  const len = parts.length
  while (index < len - 1) {
    data = data[parts[index++]]
  }
  data[parts[index]] = value
}

function getterFallback(parts: string[], safe: boolean, data: any) {
  let index = 0
  const len = parts.length
  while (index < len) {
    if (data != null || !safe) {
      data = data[parts[index++]]
    } else {
      return
    }
  }
  return data
}

function normalizePath(path: string) {
  return (
    pathCache.get(path) ||
    pathCache.set(
      path,
      split(path).map((part: string) => {
        return part.replace(CLEAN_QUOTES_REGEX, '$2')
      }),
    )
  )
}

function split(path: string) {
  return path.match(SPLIT_REGEX) || []
}

function expr(expression: string, safe: string | boolean, param?: string) {
  expression = expression || ''

  if (typeof safe === 'string') {
    param = safe
    safe = false
  }

  param = param || 'data'

  if (expression && expression.charAt(0) !== '[') {
    expression = '.' + expression
  }

  return safe ? makeSafe(expression, param) : param + expression
}

export type ForEachIterator = (
  part: string,
  isBracket: boolean,
  isArray: boolean,
  idx: number,
  parts: string[],
) => void

function forEachInternal(parts: string[], iter: ForEachIterator, thisArg?: any) {
  const len = parts.length
  let part
  let idx
  let isArray
  let isBracket: boolean = false

  for (idx = 0; idx < len; idx++) {
    part = parts[idx]

    if (part) {
      if (shouldBeQuoted(part)) {
        part = '"' + part + '"'
      }

      isBracket = isQuoted(part)
      isArray = !isBracket && /^\d+$/.test(part)

      iter.call(thisArg, part, isBracket, isArray, idx, parts)
    }
  }
}

function forEach(path: string, iter: ForEachIterator, thisArg?: any) {
  forEachInternal(split(path), iter, thisArg)
}

function isQuoted(str: string): boolean {
  return (
    str !== undefined &&
    str !== null &&
    typeof str === 'string' &&
    // tslint:disable-next-line:quotemark
    ["'", '"'].indexOf(str.charAt(0)) !== -1
  )
}

function makeSafe(path: string, param: string) {
  let result = param
  let isLast
  const splitParts = split(path)
  forEachInternal(splitParts, (part, isBracket, isArray, idx, parts) => {
    isLast = idx === parts.length - 1

    part = isBracket || isArray ? '[' + part + ']' : '.' + part

    result += part + (!isLast ? ' || {})' : ')')
  })

  return new Array(splitParts.length + 1).join('(') + result
}

function hasLeadingNumber(part: string) {
  return part.match(LEAD_DIGIT_REGEX) && !part.match(DIGIT_REGEX)
}

function hasSpecialChars(part: string) {
  return SPEC_CHAR_REGEX.test(part)
}

function shouldBeQuoted(part: string) {
  return !isQuoted(part) && (hasLeadingNumber(part) || hasSpecialChars(part))
}

export { Cache, expr, split, normalizePath, setter, getter, join, forEach }
