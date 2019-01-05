// tslint:disable:ban-types

import { Value } from './types'
import { getter } from './util/expression'

const validateName = (d: any) => {
  if (typeof d !== 'string') {
    throw new TypeError(`ref's must be strings, got: ${d}`)
  }
}

export type MapFn = (value: any) => string
export interface Options {
  contextPrefix?: string
}

// It is tempting to declare `Ref` very simply, but there are problems with these approaches:
//
// * `type Ref = Record<string, any>;` - This is essentially how it was originally declared, but
//    just about any object satisfies this contract, which makes the type declaration too loose to
//    be useful.
//
// * `type Ref = object;` - This is a variation on the previous bullet in that it is too loose.
//
// * `class Ref {}` - This is yet another variation that is too loose.
//
// * `type Ref = void;` - This works and the emitted JavaScript is just fine, but it results in some
//    confusing IntelliSense, e.g it looks like the `ref()` returns `void`, which is not the case.
//
// The solution is twofold. 1.) Declare it as a class with a private constructor to prevent it from
// being instantiated by anything but the `ref()` factory function, and; 2.) declare a private
// readonly property (that yup actually places on the prototype) to force it to be structurally
// incompatible with any other object type.

/**
 * `Ref` is an opaque type that is internal to yup. Creating a `Ref` instance is accomplished via the `ref()` factory
 * function.
 */
export default class Reference {
  public static isRef(value: any): value is Reference {
    return !!(value && (value.__isYupRef || value instanceof Reference))
  }

  public key: string
  public map: MapFn
  public prefix: string
  public isContext: boolean
  public isSelf: boolean
  public path: string
  // tslint:disable-next-line:variable-name
  public readonly __isYupRef: boolean = true
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
