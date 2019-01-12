import { BaseSchema, MixedSchema } from 'yup'
import printValue from '../../src/util/printValue'

export function expectCastFailure(schema: BaseSchema<any>, value: any) {
  expect(schema.cast(value)).toThrow(
    /The value of (.+) could not be cast to a value that satisfies the schema type/gi,
  )
}
export function genCast<S extends MixedSchema<any>>(
  inst: S,
  { invalid = [], valid = [] }: { invalid: any[]; valid: any[] },
) {
  valid.forEach(([value, result, schema = inst]) => {
    it(`should cast ${printValue(value)} to ${printValue(result)}`, () => {
      expect(schema.cast(value)).toStrictEqual(result)
    })
  })

  invalid.forEach(value => {
    it(`should not cast ${printValue(value)}`, () => {
      expectCastFailure(inst, value)
    })
  })
}
