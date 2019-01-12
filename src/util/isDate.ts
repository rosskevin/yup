export function isDate(value: any) {
  return value instanceof Date && !isNaN(value.getTime())
}

// Object.prototype.toString.call(obj) === '[object Date]'
