// tslint:disable:ban-types

import { getter } from 'property-expr'
import { Value } from './types'

const validateName = (d: any) => {
  if (typeof d !== 'string') {
    throw new TypeError(`ref's must be strings, got: ${d}`)
  }
}

export type MapFn = (value: any) => string
export interface Options {
  contextPrefix?: string
}

export default class Reference {
  public static isRef(value: any) {
    return !!(value && (value.__isYupRef || value instanceof Reference))
  }

  public key: string
  public map: MapFn
  public prefix: string
  public isContext: boolean
  public isSelf: boolean
  public path: string
  // tslint:disable-next-line:variable-name
  public __isYupRef: boolean = true
  private pathGetter: any

  constructor(keyArg: string | Function, mapFn: MapFn, options: Options = {}) {
    validateName(keyArg)
    const prefix = options.contextPrefix || '$'

    if (typeof keyArg === 'function') {
      this.key = '.'
    } else {
      this.key = keyArg
    }

    this.key = this.key.trim()
    this.prefix = prefix
    this.isContext = this.key.indexOf(prefix) === 0
    this.isSelf = this.key === '.'

    this.path = this.isContext ? this.key.slice(this.prefix.length) : this.key
    this.pathGetter = getter(this.path, true)
    this.map = mapFn || (value => value)
  }

  public toString() {
    return `Ref(${this.key})`
  }
  public resolve() {
    return this
  }

  public cast(value: Value, { parent, context }: any) {
    return this.getValue(parent, context)
  }

  public getValue(parent: any, context: any) {
    const isContext = this.isContext
    const value = this.pathGetter(isContext ? context : parent || context || {})
    return this.map(value)
  }
}
