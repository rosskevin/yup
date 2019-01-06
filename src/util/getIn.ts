import has from 'lodash/has'
import { Schema, ValidateOptions } from '../types'
import { forEach } from './expression'

function trim(part: string) {
  return part.substr(0, part.length - 1).substr(1)
}

export default function getIn<T = any>(
  schemaArg: Schema<T>,
  path: string,
  value: any,
  context?: ValidateOptions['context'],
): { schema: Schema<T>; parent?: any; parentPath?: string } {
  let schema = schemaArg
  let parent: any
  let lastPart
  let lastPartDebug: any

  // if only one "value" arg then use it for both
  context = context || value

  if (!path) {
    return {
      parent,
      parentPath: path,
      schema: schema.resolve({ context, parent /*, value*/ }),
    }
  }

  forEach(path, (partArg, isBracket, isArray) => {
    const part = isBracket ? trim(partArg) : partArg

    if (isArray || has(schema, '_subType')) {
      // we skipped an array: foo[].bar
      const idx = isArray ? parseInt(part, 10) : 0

      const resolvedSubType = schema.resolve({ context, parent /*, value */ })._subType
      if (!resolvedSubType) {
        throw new Error(
          `Yup.reach cannot resolve subTye for an array item at index: ${partArg}, in the path: ${path}. `,
        )
      }

      schema = resolvedSubType

      if (value) {
        if (isArray && idx >= value.length) {
          throw new Error(
            `Yup.reach cannot resolve an array item at index: ${partArg}, in the path: ${path}. ` +
              `because there is no value at that index. `,
          )
        }

        value = value[idx]
      }
    }

    if (!isArray) {
      schema = schema.resolve({ context, parent /*, value*/ })

      if (!has(schema, 'fields') || !has(schema.fields, part)) {
        throw new Error(
          `The schema does not contain the path: ${path}. ` +
            `(failed at: ${lastPartDebug} which is a type: "${schema._type}") `,
        )
      }

      schema = schema.fields[part]

      parent = value
      value = value && value[part]
      lastPart = partArg
      lastPartDebug = isBracket ? '[' + partArg + ']' : '.' + partArg
    }
  })

  if (schema) {
    schema = schema.resolve({ context, parent /*, value*/ })
  }

  // if (!lastPart) {
  //   throw new Error(`Yup.reach cannot resolve parentPath for ${path}`)
  // }

  return { schema, parent, parentPath: lastPart }
}
