import { MixedSchema } from 'yup'
import printValue from '../../src/util/printValue'

export function genIsType<S extends MixedSchema<any>>(schema: S, values: any[]) {
  describe('isType should be true', () => {
    values.forEach(value => {
      it(`${printValue(value)}`, () => {
        expect(schema.isType(value)).toStrictEqual(true)
      })
    })
  })
}

export function genIsNotType<S extends MixedSchema<any>>(schema: S, values: any[]) {
  describe('isType should be false', () => {
    values.forEach(value => {
      it(`${printValue(value)}`, () => {
        expect(schema.isType(value)).toStrictEqual(false)
      })
    })
  })
}
