import { boolean } from 'yup'
import { genCastInvalid, genCastValid, genIsNotType, genIsType } from './helpers'

describe('BooleanSchema', () => {
  genCastValid(boolean(), [
    ['true', true],
    ['True', true],
    [1, true],
    [0, false],
    ['false', false],
    ['False', false],
  ])
  genCastInvalid(boolean(), ['foo'])

  describe('default/defaultValue', () => {
    it('should handle default/defaultValue', () => {
      const inst = boolean()
      expect(inst.defaultValue()).toBeUndefined()
      expect(
        inst
          .default(true)
          .required()
          .defaultValue(),
      ).toStrictEqual(true)
    })
  })

  describe('isType', () => {
    // tslint:disable-next-line:no-construct
    genIsNotType(boolean(), [1, 'true', NaN, new Number('foooo'), 34545, null])
    // tslint:disable-next-line:no-construct
    genIsType(boolean(), [false, true, new Boolean(false)])

    it('nullable should work', () => {
      expect(
        boolean()
          .nullable()
          .isType(null),
      ).toStrictEqual(true)
    })
  })

  describe('isValid', () => {
    it('should work', async () => {
      expect.assertions(3)
      await expect(boolean().isValid('1')).resolves.toStrictEqual(true)
      await expect(
        boolean()
          .strict()
          .isValid(null),
      ).resolves.toStrictEqual(false)
      await expect(
        boolean()
          .nullable()
          .isValid(null),
      ).resolves.toStrictEqual(true)
    })
  })

  describe('validate', () => {
    it('should work', async () => {
      expect.assertions(1)
      await expect(
        boolean()
          .required()
          .validate(undefined),
      ).rejects.toThrow(/required/)
    })
  })
})
