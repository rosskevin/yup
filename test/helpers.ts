import { BaseSchema, MixedSchema } from '../src'
import printValue from '../src/util/printValue'

export function castAndShouldFail(schema: BaseSchema<any>, value: any) {
  return (() => schema.cast(value)).should.throw(
    TypeError,
    /The value of (.+) could not be cast to a value that satisfies the schema type/gi,
  )
}

export function generateCastTests<S extends MixedSchema<any>>(
  inst: S,
  { invalid = [], valid = [] },
) {
  valid.forEach(([value, result, schema = inst]) => {
    it(`should cast ${printValue(value)} to ${printValue(result)}`, () => {
      expect(schema.cast(value)).toStrictEqual(result)
    })
  })

  invalid.forEach(value => {
    it(`should not cast ${printValue(value)}`, () => {
      castAndShouldFail(inst, value)
    })
  })
}

export function generateIsValidTests<S extends MixedSchema<any>>(
  inst: S,
  { valid = [], invalid = [] }: { valid: any[]; invalid: any[] },
) {
  describe('valid:', () => {
    runValidations(valid, true)
  })

  describe('invalid:', () => {
    runValidations(invalid, false)
  })

  function runValidations(arr: any[], expectValid: boolean) {
    arr.forEach(config => {
      let message = ''
      let value = config
      let schema = inst

      if (Array.isArray(config)) {
        ;[value, schema, message = ''] = config
      }

      it(`${printValue(value)}${message && `  (${message})`}`, () =>
        schema.isValid(value).should.become(expectValid))
    })
  }
}
