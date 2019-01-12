import { locale } from './locale'
import { MixedSchema } from './MixedSchema'
import { Ref } from './Ref'
import { Message } from './types'
import { isAbsent } from './util/isAbsent'

// tslint:disable-next-line:max-line-length
const rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i
// tslint:disable-next-line:max-line-length
const rUrl = /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i

function hasLength(value: any) {
  return isAbsent(value) || value.length > 0
}

function isTrimmed(value: any) {
  return isAbsent(value) || value === value.trim()
}

export function string() {
  return new StringSchema()
}

export interface MatchesOptions {
  message?: Message
  excludeEmptyString?: boolean
}

export class StringSchema extends MixedSchema {
  constructor() {
    super({ type: 'string' })

    this.withMutation(() => {
      this.transform(function(value) {
        if (this.isType(value)) {
          return value
        }
        return value !== undefined && value !== null && (value as any).toString
          ? (value as any).toString()
          : value
      })
    })
  }

  public _typeCheck(value: any) {
    if (value instanceof String) {
      value = value.valueOf()
    }

    return typeof value === 'string'
  }

  public required(message: Message = locale.mixed.required) {
    const next = super.required(message)

    return next.test({ message, name: 'required', test: hasLength })
  }

  public length(length: number | Ref, message = locale.string.length) {
    return this.test({
      exclusive: true,
      message,
      name: 'length',
      params: { length },
      test(value) {
        return isAbsent(value) || value.length === this.resolve(length)
      },
    })
  }

  public min(min: number | Ref, message = locale.string.min) {
    return this.test({
      exclusive: true,
      message,
      name: 'min',
      params: { min },
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min)
      },
    })
  }

  public max(max: number | Ref, message = locale.string.max) {
    return this.test({
      exclusive: true,
      message,
      name: 'max',
      params: { max },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max)
      },
    })
  }

  public matches(regex: RegExp, options?: Message | MatchesOptions) {
    let excludeEmptyString: boolean | undefined
    let message: Message | undefined

    if (options) {
      if ((options as any).message || options.hasOwnProperty('excludeEmptyString')) {
        const matchesOptions: MatchesOptions = options as MatchesOptions
        excludeEmptyString = matchesOptions.excludeEmptyString || false
        message = matchesOptions.message
      } else {
        message = options as Message
      }
    }

    return this.test({
      message: message || locale.string.matches,
      name: 'matches',
      params: { regex },
      test: value => isAbsent(value) || (value === '' && excludeEmptyString) || regex.test(value),
    })
  }

  public email(message = locale.string.email) {
    return this.matches(rEmail, {
      excludeEmptyString: true,
      message,
    })
  }

  public url(message = locale.string.url) {
    return this.matches(rUrl, {
      excludeEmptyString: true,
      message,
    })
  }

  // -- transforms --
  public ensure() {
    return this.default('').transform(val => (val === null ? '' : val))
  }

  public trim(message = locale.string.trim): this {
    return this.transform(val => (val != null ? val.trim() : val)).test({
      message,
      name: 'trim',
      test: isTrimmed,
    })
  }

  public lowercase(message = locale.string.lowercase) {
    return this.transform(value => (!isAbsent(value) ? value.toLowerCase() : value)).test({
      exclusive: true,
      message,
      name: 'string_case',
      test: value => isAbsent(value) || value === value.toLowerCase(),
    })
  }

  public uppercase(message = locale.string.uppercase) {
    return this.transform(value => (!isAbsent(value) ? value.toUpperCase() : value)).test({
      exclusive: true,
      message,
      name: 'string_case',
      test: value => isAbsent(value) || value === value.toUpperCase(),
    })
  }
}
