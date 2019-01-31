import has from 'lodash/has'
import { MixedSchema } from '../MixedSchema'
import { ValidateOptions } from '../types'
import { forEach } from './expression'
import { isArraySchema } from './isArraySchema'
import { isMixedSchema } from './isMixedSchema'
import { isObjectSchema } from './isObjectSchema'

function trim(part: string) {
  return part.substr(0, part.length - 1).substr(1)
}

export function getIn<S extends MixedSchema>(
  schemaArg: S,
  path: string,
  value: any,
  context?: ValidateOptions['context'],
): { schema: S; parent?: any; parentPath?: string } {
  let candidateSchema: S = schemaArg
  let parent: any
  let lastPart
  let lastPartDebug: any

  // if only one "value" arg then use it for both
  context = context || value

  if (!path) {
    return {
      parent,
      parentPath: path,
      schema: candidateSchema.resolve({ context, parent /*, value*/ }),
    }
  }

  forEach(path, (partArg, isBracket, isArray) => {
    const part = isBracket ? trim(partArg) : partArg

    if (isArray || has(candidateSchema, 'itemSchema')) {
      // we skipped an array: foo[].bar
      const idx = isArray ? parseInt(part, 10) : 0

      const arraySchema = candidateSchema.resolve({ context, parent /*, value */ })
      if (!isArraySchema(arraySchema)) {
        throw new Error('Expected schema to be an ArraySchema')
      }
      const arrayItemSchema = arraySchema.itemSchema
      if (!arrayItemSchema) {
        throw new Error(
          `Cannot resolve item schema for an array item at index: ${partArg}, in the path: ${path}. `,
        )
      }

      candidateSchema = arrayItemSchema as any // FIXME

      if (value) {
        if (isArray && idx >= value.length) {
          throw new Error(
            `Cannot resolve an array item at index: ${partArg}, in the path: ${path}. ` +
              `because there is no value at that index. `,
          )
        }

        value = value[idx]
      }
    }

    if (!isArray) {
      candidateSchema = candidateSchema.resolve({ context, parent /*, value*/ })

      // if (!has(candidateSchema, 'fields') || !has((candidateSchema as any).fields, part)) {
      if (!isObjectSchema(candidateSchema)) {
        throw new Error(
          `The schema does not contain the path: ${path}. ` +
            `(failed at: ${lastPartDebug} which is a type: "${candidateSchema._type}") `,
        )
      } else {
        candidateSchema = candidateSchema.fields[part] as S // FIXME not possible to be lazy or ref at this point?

        parent = value
        value = value && value[part]
        lastPart = partArg
        lastPartDebug = isBracket ? '[' + partArg + ']' : '.' + partArg
      }
    }
  })

  if (candidateSchema) {
    candidateSchema = candidateSchema.resolve({ context, parent /*, value*/ })
  }

  // if (!lastPart) {
  //   throw new Error(`Yup.reach cannot resolve parentPath for ${path}`)
  // }

  if (!isMixedSchema(candidateSchema)) {
    throw new Error('Expected to have resolved a concrete schema')
  }

  return { schema: candidateSchema, parent, parentPath: lastPart }
}
