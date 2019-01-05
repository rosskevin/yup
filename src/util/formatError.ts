import printValue from './printValue'

export type MessageFormatter = (params: Params) => string

const strReg = /\$\{\s*(\w+)\s*\}/g

function replace(str: string): MessageFormatter {
  const formatter: MessageFormatter = (params: Params) =>
    str.replace(strReg, (_, key) => printValue(params[key]))
  return formatter
}

// not sure if this type is shared anywhere else, but the test seems to indicate an open object
export interface Params {
  [key: string]: any
}

export default function formatError(
  message: string | MessageFormatter,
  paramsArg?: Params,
): string | MessageFormatter {
  if (typeof message === 'string') {
    message = replace(message)
  }

  const formatter = (p: Params) => {
    p.path = p.label || p.path || 'this'
    return typeof message === 'function' ? message(p) : message
  }

  // return arguments.length === 1 ? formatter : formatter(paramsArg)
  if (paramsArg) {
    return formatter(paramsArg)
  } else {
    return formatter
  }
}
