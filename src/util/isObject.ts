export default function isObject(o: any): o is object {
  return Object.prototype.toString.call(o) === '[object Object]'
}
