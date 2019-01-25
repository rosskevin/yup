import { date, ref } from 'yup'
import { isDate } from '../src/util/isDate'
import { genCastValid, genIsNotType, genIsType } from './helpers'

describe('DateSchema', () => {
  describe('cast', () => {
    genCastValid(date(), [
      ['01 Jan 1970 00:00:00 GMT', new Date(0)],
      ['jan 15 2014', new Date(2014, 0, 15)],
      ['2014-09-23T19:25:25Z', new Date(1411500325000)],
      // Leading-zero milliseconds
      ['2016-08-10T11:32:19.012Z', new Date(1470828739012)],
      // Microsecond precision
      ['2016-08-10T11:32:19.2125Z', new Date(1470828739212)],
    ])

    it('instanceOf should be Date', () => {
      expect(date().cast(new Date())).toBeInstanceOf(Date)
    })

    it('should return invalid date for failed casts', () => {
      const inst = date()
      expect(isDate(inst.cast(null, { assert: false }))).toStrictEqual(false)
      expect(isDate(inst.cast('', { assert: false }))).toStrictEqual(false)
    })
  })

  describe('isType', () => {
    genIsNotType(date(), [false, null, NaN])
    genIsType(date(), [new Date()])
    it('should work', () => {
      expect(
        date()
          .nullable()
          .isType(null), // FIXME was new Date()
      ).toStrictEqual(true)
    })
  })

  describe('isValid', () => {
    it('null should work', async () => {
      expect.assertions(2)
      await expect(date().isValid(null)).resolves.toStrictEqual(false)
      await expect(
        date()
          .nullable()
          .isValid(null),
      ).resolves.toStrictEqual(true)
    })

    it('required should work', async () => {
      const inst = date()
        .required()
        .max(new Date(2014, 5, 15))

      expect.assertions(3)
      await expect(inst.isValid(new Date(2014, 0, 15))).resolves.toStrictEqual(true)
      await expect(inst.isValid(new Date(2014, 7, 15))).resolves.toStrictEqual(false)
      await expect(inst.isValid('5')).resolves.toStrictEqual(true)
    })
  })

  describe('validate', () => {
    it('required should work', async () => {
      expect.assertions(1)
      expect(
        date()
          .required()
          .max(new Date(2014, 5, 15))
          .validate(null),
      ).rejects.toMatchObject({ errors: ['required'] })
    })
  })

  describe('min', () => {
    const min = new Date(2014, 3, 15)
    const invalid = new Date(2014, 1, 15)
    const valid = new Date(2014, 5, 15)

    it('min should assert value type', () => {
      expect(() => date().min('hello' as any)).toThrow(TypeError)
      expect(date().min(ref('$foo'))).toMatchObject({})
    })

    it('isValid should work', async () => {
      expect.assertions(3)
      await expect(
        date()
          .min(min)
          .isValid(valid),
      ).resolves.toStrictEqual(true)
      await expect(
        date()
          .min(min)
          .isValid(invalid),
      ).resolves.toStrictEqual(false)
      await expect(
        date()
          .min(min)
          .isValid(null),
      ).resolves.toStrictEqual(false)
    })

    it('isValid ref should work', async () => {
      expect.assertions(2)
      await expect(
        date()
          .min(ref('$foo'))
          .isValid(valid, { context: { foo: min } }),
      ).resolves.toStrictEqual(true)
      await expect(
        date()
          .min(ref('$foo'))
          .isValid(invalid, { context: { foo: min } }),
      ).resolves.toStrictEqual(false)
    })
  })

  describe('max', () => {
    const max = new Date(2014, 7, 15)
    const invalid = new Date(2014, 9, 15)
    const valid = new Date(2014, 5, 15)
    it('max should assert value type', () => {
      expect(() => date().max('hello' as any)).toThrow(TypeError)
      expect(date().max(ref('$foo'))).toMatchObject({})
    })
    it('isValid should work', async () => {
      expect.assertions(3)
      expect(
        date()
          .max(max)
          .isValid(valid),
      ).resolves.toStrictEqual(true)
      expect(
        date()
          .max(max)
          .isValid(invalid),
      ).resolves.toStrictEqual(false)
      expect(
        date()
          .max(max)
          .nullable(true)
          .isValid(null),
      ).resolves.toStrictEqual(true)
    })

    it('isValid ref should work', async () => {
      expect.assertions(2)
      expect(
        date()
          .max(ref('$foo'))
          .isValid(valid, { context: { foo: max } }),
      ).resolves.toStrictEqual(true)
      expect(
        date()
          .max(ref('$foo'))
          .isValid(invalid, { context: { foo: max } }),
      ).resolves.toStrictEqual(false)
    })
  })
})
