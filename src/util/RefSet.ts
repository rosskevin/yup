import { Ref } from '../Ref'

export default class RefSet {
  private set: Set<any> = new Set()
  private refs: Map<any, any> = new Map()

  public toArray() {
    return Array.from(this.set).concat(Array.from(this.refs.values()))
  }
  public add(value: any) {
    Ref.isRef(value) ? this.refs.set(value.key, value) : this.set.add(value)
  }
  public delete(value: any) {
    Ref.isRef(value) ? this.refs.delete(value.key /*, value */) : this.set.delete(value)
  }
  public has(value: any, resolve: (i: any) => any) {
    if (this.set.has(value)) {
      return true
    }

    const values = this.refs.values()
    let item = values.next()
    while (!item.done) {
      if (resolve(item.value) === value) {
        return true
      }
      item = values.next()
    }

    return false
  }
}
