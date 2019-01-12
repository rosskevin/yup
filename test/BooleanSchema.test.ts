import { boolean } from 'yup'
import { expectCastFailure } from './helpers'

describe('BooleanSchema', () => {
  describe('cast', () => {
    it('should work', () => {
      const inst = boolean()
      expect(inst.cast('true')).toStrictEqual(true)
      expect(inst.cast('True')).toStrictEqual(true)
      expect(inst.cast('false')).toStrictEqual(false)
      expect(inst.cast('False')).toStrictEqual(false)
      expect(inst.cast(1)).toStrictEqual(true)
      expect(inst.cast(0)).toStrictEqual(false)
      expectCastFailure(inst, 'foo')
      expectCastFailure(inst, 'bar1')
    })
  })

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
