import has from 'lodash/has'
import isObject from './isObject'
import isSchema from './isSchema'

export default function merge(target: object, source: object) {
  for (const key in source) {
    if (has(source, key)) {
      const targetVal = target[key]
      const sourceVal = source[key]

      if (sourceVal === undefined) {
        continue
      }

      if (isSchema(sourceVal)) {
        target[key] = isSchema(targetVal) ? targetVal.concat(sourceVal) : sourceVal
      } else if (isObject(sourceVal)) {
        target[key] = isObject(targetVal) ? merge(targetVal, sourceVal) : sourceVal
      } else if (Array.isArray(sourceVal)) {
        target[key] = Array.isArray(targetVal) ? targetVal.concat(sourceVal) : sourceVal
      } else {
        target[key] = source[key]
      }
    }
  }

  return target
}
