export default function makePath(strings: string[], ...values: any[]) {
  const path = strings.reduce((str, next) => {
    const value = values.shift()
    return str + (value == null ? '' : value) + next
  })

  return path.replace(/^\./, '')
}
