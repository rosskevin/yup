import ValidationError from '../ValidationError' // this may or may not be right - based on the err name below

function findIndex(arr: string[], err: ValidationError) {
  let idx = Infinity
  arr.some((key, ii) => {
    if (err.path.indexOf(key) !== -1) {
      idx = ii
      return true
    }
    return false
  })

  return idx
}

export default function sortByKeyOrder(fields: object) {
  const keys = Object.keys(fields)
  return (a: ValidationError, b: ValidationError) => {
    return findIndex(keys, a) - findIndex(keys, b)
  }
}
