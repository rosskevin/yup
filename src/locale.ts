import printValue from './util/printValue'

export interface LocaleFnArgs {
  path: string
  type: string
  value: any
  originalValue: any
}
export type LocaleFn = (args: LocaleFnArgs) => string

export let mixed = {
  default: '${path} is invalid',
  notOneOf: '${path} must not be one of the following values: ${values}',
  notType: ({ path, type, value, originalValue }: LocaleFnArgs) => {
    const isCast = originalValue != null && originalValue !== value
    let msg =
      `${path} must be a \`${type}\` type, ` +
      `but the final value was: \`${printValue(value, true)}\`` +
      (isCast ? ` (cast from the value \`${printValue(originalValue, true)}\`).` : '.')

    if (value === null) {
      msg += `\n If "null" is intended as an empty value be sure to mark the schema as \`.nullable()\``
    }

    return msg
  },
  oneOf: '${path} must be one of the following values: ${values}',
  required: '${path} is a required field',
}

// tslint:disable-next-line:variable-name
export const string = {
  email: '${path} must be a valid email',
  length: '${path} must be exactly ${length} characters',
  lowercase: '${path} must be a lowercase string',
  matches: '${path} must match the following: "${regex}"',
  max: '${path} must be at most ${max} characters',
  min: '${path} must be at least ${min} characters',
  trim: '${path} must be a trimmed string',
  uppercase: '${path} must be a upper case string',
  url: '${path} must be a valid URL',
}

// tslint:disable-next-line:variable-name
export const number = {
  integer: '${path} must be an integer',
  lessThan: '${path} must be less than ${less}',
  max: '${path} must be less than or equal to ${max}',
  min: '${path} must be greater than or equal to ${min}',
  moreThan: '${path} must be greater than ${more}',
  negative: '${path} must be a negative number',
  notEqual: '${path} must be not equal to ${notEqual}',
  positive: '${path} must be a positive number',
}

export const date = {
  max: '${path} field must be at earlier than ${max}',
  min: '${path} field must be later than ${min}',
}

// tslint:disable-next-line:variable-name
export const boolean = {}

export const object = {
  noUnknown: '${path} field cannot have keys not specified in the object shape',
}

export const array = {
  max: '${path} field must have less than or equal to ${max} items',
  min: '${path} field must have at least ${min} items',
}

export default {
  array,
  boolean,
  date,
  mixed,
  number,
  object,
  string,
}
