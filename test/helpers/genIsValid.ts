import { BaseSchema, MixedSchema } from 'yup'
import printValue from '../../src/util/printValue'

function _generateIsValidTest<S extends MixedSchema<any>>(
  schema: S,
  arr: any[],
  expectation: boolean,
) {
  arr.forEach(config => {
    let message = ''
    let value = config

    if (Array.isArray(config)) {
      ;[value, schema, message = ''] = config
    }

    const description = `${printValue(value)}${message && `  (${message})`}`
    it(description, async () => {
      expect.assertions(1)
      await expect(schema.isValid(value)).toStrictEqual(expectation)
    })
  })
}

export function genIsInvalid<S extends MixedSchema<any>>(schema: S, values: any[]) {
  describe('isValid should be false', () => {
    _generateIsValidTest(schema, values, false)
  })
}

export function genIsValid<S extends MixedSchema<any>>(schema: S, values: any[]) {
  describe('isValid should be true', () => {
    _generateIsValidTest(schema, values, true)
  })
}
