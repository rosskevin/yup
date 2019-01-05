import isAbsent from './isAbsent'

export default function isNotEmpty(value: any) {
  return !isAbsent(value)
}
