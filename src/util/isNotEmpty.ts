import { isAbsent } from './isAbsent'

export function isNotEmpty(value: any) {
  return !isAbsent(value)
}
