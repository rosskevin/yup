import { BaseSchema, MixedSchema } from 'yup'
import printValue from '../src/util/printValue'

export function castAndShouldFail(schema: BaseSchema<any>, value: any) {
  expect(schema.cast(value)).toThrow(
    /The value of (.+) could not be cast to a value that satisfies the schema type/gi,
  )
}

export function generateCastTests<S extends MixedSchema<any>>(
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
      castAndShouldFail(inst, value)
    })
  })
}

function _generateIsValidTest<S extends MixedSchema<any>>(
  schema: S,
  arr: any[],
  expectation: boolean,
) {
  arr.forEach(config => {
    let message = ''
    let value = config

    if (Array.isArray(config)) {
      [value, schema, message = ''] = config
    }

    const description = `${printValue(value)}${message && `  (${message})`}`
    it(description, async () => {
      expect.assertions(1)
      await expect(schema.isValid(value)).toStrictEqual(expectation)
    })
  })
}

export function genIsInvalidTests<S extends MixedSchema<any>>(schema: S, values: any[]) {
  describe('should be invalid', () => {
    _generateIsValidTest(schema, values, false)
  })
}

export function genIsValidTests<S extends MixedSchema<any>>(schema: S, values: any[]) {
  describe('should be valid', () => {
    _generateIsValidTest(schema, values, true)
  })
}
