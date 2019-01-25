import * as sinon from 'sinon'
import { array, lazy, mixed, number, object, string, StringSchema } from 'yup'
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
        array()
          .of(object().shape({ name: string() }))
          .cast([{ id: 1, name: 'john' }], { stripUnknown: true }),
      ).toStrictEqual([{ name: 'john' }])
    })

    it('should prevent recursive casting', async () => {
      const castSpy = sinon.spy(StringSchema.prototype, '_cast')
      const value = await array()
        .of(string())
        .validate([5])
      expect(value[0]).toStrictEqual('5')
      expect(castSpy.calledOnce).toStrictEqual(true)
      // tslint:disable-next-line
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
          .concat(array()).itemSchema,
      ).not.toBeNull()

      // expect(
      //   array()
      //     .of(number())
      //     .concat(array().of(false)).itemSchema, // sub-schema must be a valid schema
      // ).toStrictEqual(false)
    })
  })

  describe('isValid', () => {
    it('should allow undefined', async () => {
      expect.assertions(1)
      await expect(
        array()
          .of(number().max(5))
          .isValid(undefined as any),
      ).resolves.toStrictEqual(true)
    })

    it('should not allow null when not nullable', async () => {
      expect.assertions(2)
      await expect(array().isValid(null)).resolves.toStrictEqual(false)

      await expect(
        array()
          .nullable()
          .isValid(null),
      ).resolves.toStrictEqual(true)
    })

    it('should respect subtype validations', async () => {
      const inst = array().of(number().max(5))

      expect.assertions(3)
      await expect(inst.isValid(['gg', 3])).resolves.toStrictEqual(false)
      await expect(inst.isValid([7, 3])).resolves.toStrictEqual(false)
      await expect(inst.validate(['4', 3])).resolves.toStrictEqual([4, 3])
    })
  })

  it('should respect abortEarly', async () => {
    const inst = array()
      .of(object().shape({ str: string().required() }))
      .test({ name: 'name', message: 'oops', test: () => false })

    // expect.assertions(3)
    await expect(inst.validate([{ str: '' }])).rejects.toThrow(/oops/)

    await expect(inst.validate([{ str: '' }], { abortEarly: false })).rejects.toThrow(
      /2 errors occurred/,
    )
    // await expect(inst.validate([{ str: '' }], { abortEarly: false })).rejects.toThrow(
    //   /\[0\].str is a required field/,
    // )
    // await expect(inst.validate([{ str: '' }], { abortEarly: false })).rejects.toThrow(/oops/)
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

  // from old docs
  describe('lazy', () => {
    it('docs', () => {
      const renderable = lazy((...value: any[]) => {
        switch (typeof value) {
          case 'number':
            return number()
          case 'string':
            return string()
          default:
            return mixed()
        }
      })

      const renderables = array().of(renderable)
    })

    // it('yep', async () => {
    //   const inst = array().of(lazy(() => number()))

    //   // expect.assertions(1)
    //   // FIXME I made this up based on another but not sure it is right
    //   await expect(inst.validate(['1'], { strict: true })).rejects.toThrow()
    // })
  })
})
