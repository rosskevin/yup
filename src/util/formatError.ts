import { MessageFormatter, MessageFormatterParams } from '../types'
import printValue from './printValue'

const strReg = /\$\{\s*(\w+)\s*\}/g

function replace(str: string): MessageFormatter {
  const formatter: MessageFormatter = (params: MessageFormatterParams) =>
    str.replace(strReg, (_, key) => printValue(params[key]))
  return formatter
}

export default function formatError(
  message: string | MessageFormatter,
  paramsArg?: MessageFormatterParams,
): string | MessageFormatter {
  if (typeof message === 'string') {
    message = replace(message)
  }

  const formatter = (p: MessageFormatterParams) => {
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
