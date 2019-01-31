import has from 'lodash/has'
import { ArraySchema } from '../ArraySchema'
import { MixedSchema } from '../MixedSchema'
import { AnyConcreteSchema, AnySchema, ValidateOptions } from '../types'
import { forEach } from './expression'

// const trim = part => part.substr(0, part.length - 1).substr(1)
function trim(part: string) {
  return part.substr(0, part.length - 1).substr(1)
}

export function getIn<S extends AnySchema>(
  schema: S,
  path: string,
  value: any,
  context?: ValidateOptions['context'],
): { schema: S; parent?: any; parentPath?: string } {
  let parent: any
  let lastPart
  let lastPartDebug: any

  // if only one "value" arg then use it for both
  context = context || value

  if (!path) {
    return {
      parent,
      parentPath: path,
      schema: schema.resolve({ context, parent /*, value */ }) as any, // FIXME changed
    }
  }

  // tslint:disable-next-line:variable-name
  forEach(path, (_part, isBracket, isArray) => {
    const part = isBracket ? trim(_part) : _part

    if (isArray || has(schema, 'itemSchema')) {
      // we skipped an array: foo[].bar
      const idx = isArray ? parseInt(part, 10) : 0

      schema = (schema as ArraySchema).resolve({ context, parent /*, value*/ }).itemSchema as any // FIXME changed

      if (value) {
        if (isArray && idx >= value.length) {
          throw new Error(
            `Yup.reach cannot resolve an array item at index: ${_part}, in the path: ${path}. ` +
              `because there is no value at that index. `,
          )
        }

        value = value[idx]
      }
    }

    if (!isArray) {
      schema = schema.resolve({ context, parent /*, value*/ }) as any

      if (!has(schema, 'fields') || !has((schema as any).fields, part)) {
        throw new Error(
          `The schema does not contain the path: ${path}. ` +
            `(failed at: ${lastPartDebug} which is a type: "${schema._type}") `,
        )
      }

      schema = (schema as any).fields[part]

      parent = value
      value = value && value[part]
      lastPart = part
      lastPartDebug = isBracket ? '[' + _part + ']' : '.' + _part
    }
  })

  if (schema) {
    schema = schema.resolve({ context, parent /*, value */ }) as any
  }

  return { schema, parent, parentPath: lastPart }
}
