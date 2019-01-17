export function ensureSync(fn: any) {
  let run = false
  const resolve = (t: any) => {
    if (!run) {
      return t
    }
    throw new Error('Did not execute synchonously')
  }
  const err = (t: any) => {
    if (!run) {
      throw t
    }
    throw new Error('Did not execute synchonously')
  }

  const result = fn().then(resolve, err)

  run = true
  return result
}
