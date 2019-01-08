import { boolean, lazy, mixed, object, string } from '../../src'
import isConcreteSchema from '../../src/util/isConcreteSchema'

describe('isConcreteSchema', () => {
  it('should be true', () => {
    expect(isConcreteSchema(boolean())).toStrictEqual(true)
    expect(isConcreteSchema(mixed())).toStrictEqual(true)
    expect(isConcreteSchema(object())).toStrictEqual(true)
    expect(isConcreteSchema(string())).toStrictEqual(true)
  })

  it('should be false', () => {
    expect(isConcreteSchema(lazy(() => {}))).toStrictEqual(false)
    expect(isConcreteSchema(false)).toStrictEqual(false)
    expect(isConcreteSchema(undefined)).toStrictEqual(false)
  })
})
