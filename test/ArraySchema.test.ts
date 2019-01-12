import * as sinon from 'sinon'
import { array, number, object, string, StringSchema } from 'yup'
import { genIsNotType, genIsType } from './helpers'

describe('ArraySchema', () => {
  describe('cast', () => {
    it('should parse json strings', () => {
      expect(array().cast('[2,3,5,6]')).toStrictEqual([2, 3, 5, 6])
    })

    it('should return null for failed casts', () => {
      expect(array().cast('asfasf', { assert: false })).toBeNull()
      expect(array().cast(null, { assert: false })).toBeNull()
    })

    it('should recursively cast fields', () => {
      expect(
        array()
          .of(number())
          .cast(['4', '5']),
      ).toStrictEqual([4, 5])

      expect(
        array()
          .of(string())
          .cast(['4', 5, false]),
      ).toStrictEqual(['4', '5', 'false'])
    })

    it('should cast children', () => {
      expect(
        array()
          .of(number())
          .cast(['1', '3']),
      ).toStrictEqual([1, 3])
    })

    it('should pass options to children', () => {
      expect(
        array(object({ name: string() })).cast([{ id: 1, name: 'john' }], { stripUnknown: true }),
      ).toStrictEqual([{ name: 'john' }])
    })

    it('should prevent recursive casting', async () => {
      const castSpy = sinon.spy(StringSchema.prototype, '_cast')
      const value = await array(string()).validate([5])
      expect(value[0]).toStrictEqual('5')
      expect(castSpy.calledOnce).toStrictEqual(true)
      // tslint:disable-next-line:align
      ;(StringSchema.prototype._cast as any).restore()
    })
  })

  describe('default/defaultValue', () => {
    it('should handle default/defaultValue', () => {
      expect(array().defaultValue()).toBeUndefined()

      expect(
        array()
          .default(() => [1, 2, 3])
          .defaultValue(),
      ).toStrictEqual([1, 2, 3])
    })
  })

  describe('isType', () => {
    genIsNotType(array(), [{}, 'true', NaN, 34545, null])
    genIsType(array(), [[]])

    it('nullable should work', () => {
      expect(
        array()
          .nullable()
          .isType(null),
      ).toStrictEqual(true)
    })
  })

  describe('concat', () => {
    it('should work', () => {
      expect(
        array()
          .of(number())
          .concat(array())._subType,
      ).not.toBeNull()

      expect(
        array()
          .of(number())
          .concat(array().of(false))._subType,
      ).toStrictEqual(false)
    })
  })

  describe('isValid', () => {
    it('should allow undefined', async () => {
      expect.assertions(1)
      await expect(
        array()
          .of(number().max(5))
          .isValid(undefined as any),
      ).toStrictEqual(true)
    })

    it('should not allow null when not nullable', async () => {
      await array()
        .isValid(null)
        .should.become(false)

      await array()
        .nullable()
        .isValid(null)
        .should.become(true)
    })

    it('should respect subtype validations', async () => {
      const inst = array().of(number().max(5))
      await inst.isValid(['gg', 3]).should.become(false)
      await inst.isValid([7, 3]).should.become(false)
      const value = await inst.validate(['4', 3])
      value.should.eql([4, 3])
    })
  })

  it('should respect abortEarly', async () => {
    const inst = array()
      .of(object({ str: string().required() }))
      .test({ name: 'name', message: 'oops', test: () => false })

    expect.assertions(2)
    await expect(inst.validate([{ str: '' }])).rejects.toMatchObject({
      errors: ['oops'],
      value: { str: '' },
    })

    await expect(inst.validate([{ str: '' }], { abortEarly: false })).rejects.toMatchObject({
      errors: ['[0].str is a required field', 'oops'],
      value: { str: '' },
    })
  })

  describe('compact', () => {
    it('should work', () => {
      const arr = ['', 1, 0, 4, false, null]
      expect(
        array()
          .compact()
          .cast(arr),
      ).toStrictEqual([1, 4])

      expect(
        array()
          .compact(v => v == null)
          .cast(arr),
      ).toStrictEqual(['', 1, 0, 4, false])
    })
  })

  describe('ensure', () => {
    it('should work', () => {
      const a = [1, 4]
      expect(
        array()
          .ensure()
          .cast(a),
      ).toStrictEqual(a)
      expect(
        array()
          .ensure()
          .cast(null),
      ).toStrictEqual([])
    })
  })
})
