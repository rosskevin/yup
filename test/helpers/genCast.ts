import { MixedSchema } from 'yup'
import printValue from '../../src/util/printValue'

export function expectCastFailure(schema: MixedSchema, value: any) {
  expect(schema.cast(value)).toThrow(
    /The value of (.+) could not be cast to a value that satisfies the schema type/gi,
  )
}

export function genCastValid<S extends MixedSchema<any>>(inst: S, values: any[]) {
  describe('cast should be valid', () => {
    values.forEach(([value, result, schema = inst]) => {
      it(`${printValue(value)} to ${printValue(result)}`, () => {
        expect(schema.cast(value)).toStrictEqual(result)
      })
    })
  })
}

export function genCastInvalid<S extends MixedSchema<any>>(inst: S, values: any[]) {
  describe('cast should be invalid', () => {
    values.forEach(value => {
      it(`${printValue(value)}`, () => {
        expectCastFailure(inst, value)
      })
    })
  })
}
