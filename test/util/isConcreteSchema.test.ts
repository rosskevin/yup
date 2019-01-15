import { boolean, lazy, mixed, object, string } from '../../src'
import { isMixedSchema } from '../../src/util/isMixedSchema'

describe('isMixedSchema', () => {
  it('should be true', () => {
    expect(isMixedSchema(boolean())).toStrictEqual(true)
    expect(isMixedSchema(mixed())).toStrictEqual(true)
    expect(isMixedSchema(object())).toStrictEqual(true)
    expect(isMixedSchema(string())).toStrictEqual(true)
  })

  it('should be false', () => {
    expect(isMixedSchema(lazy((() => {}) as any))).toStrictEqual(false)
    expect(isMixedSchema(false)).toStrictEqual(false)
    expect(isMixedSchema(undefined)).toStrictEqual(false)
  })
})
