import { boolean } from 'yup'
import { expectCastFailure, genCastInvalid, genCastValid } from './helpers'

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
    it('should work', () => {
      const inst = boolean()
      expect(inst.isType(1)).toStrictEqual(false)
      expect(inst.isType(false)).toStrictEqual(true)
      expect(inst.isType('true')).toStrictEqual(false)
      expect(inst.isType(NaN)).toStrictEqual(false)
      // tslint:disable-next-line:no-construct
      expect(inst.isType(new Number('foooo'))).toStrictEqual(false)
      expect(inst.isType(34545)).toStrictEqual(false)
      // tslint:disable-next-line:no-construct
      expect(inst.isType(new Boolean(false))).toStrictEqual(true)
      expect(inst.isType(null)).toStrictEqual(false)
      expect(inst.nullable().isType(null)).toStrictEqual(true)
    })
  })

  describe('isValid', () => {
    it('should work', async () => {
      expect.assertions(3)
      await expect(boolean().isValid('1')).toStrictEqual(true)
      await expect(
        boolean()
          .strict()
          .isValid(null),
      ).toStrictEqual(false)
      await expect(
        boolean()
          .nullable()
          .isValid(null),
      ).toStrictEqual(true)
    })
  })

  describe('validate', () => {
    it('should work', async () => {
      expect.assertions(1)
      await expect(
        boolean()
          .required()
          .validate(null),
      ).rejects.toThrow(/required/)
    })
  })
})
