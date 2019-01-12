import { number, NumberSchema } from 'yup'
import { genCastInvalid, genCastValid, genIsInvalid, genIsValid } from './helpers'

describe('NumberSchema', () => {
  it('should print the original value', async () => {
    await expect(number().validate('john')).rejects.toThrow(
      /the final value was: `NaN`.+cast from the value `"john"`/,
    )
  })

  if ((global as any).YUP_USE_SYNC) {
    describe('synchronous', () => {
      describe('validateSync', () => {
        it('should throw', () => {
          expect(number().validateSync('john')).toThrow(
            /the final value was: `NaN`.+cast from the value `"john"`/,
          )
        })
      })
      describe('isValidSync', () => {
        it('should be valid', () => {
          expect(number().isValidSync('john')).toStrictEqual(false)
        })

        it('should isValid synchronously', () => {
          expect(number().isValidSync('john')).toStrictEqual(false)
        })
      })
    })
  }

  it('is extensible', () => {
    class MyNumber extends NumberSchema {
      public foo() {
        return this
      }
    }

    new MyNumber()
      .foo()
      .integer()
      .required()
  })

  describe('cast', () => {
    genCastInvalid(
      number(),
      // tslint:disable-next-line:no-construct
      ['', false, true, new Date(), new Number('foo')],
    )

    genCastValid(number(), [
      ['5', 5],
      [3, 3],
      // [new Number(5), 5],
      [' 5.656 ', 5.656],
    ])

    it('should round', () => {
      expect(
        number()
          .round('floor')
          .cast(45.99999),
      ).toStrictEqual(45)
      expect(
        number()
          .round('ceil')
          .cast(45.1111),
      ).toStrictEqual(46)
      expect(
        number()
          .round()
          .cast(45.444444),
      ).toStrictEqual(45)
      expect(
        number()
          .nullable()
          .integer()
          .round()
          .cast(null),
      ).toBeNull()

      expect(number().round('fasf' as any)).toThrow(TypeError)
    })

    it('should truncate', () => {
      expect(
        number()
          .truncate()
          .cast(45.55),
      ).toStrictEqual(45)
    })

    it('should return NaN for failed casts', () => {
      expect(number().cast('asfasf', { assert: false })).toStrictEqual(NaN)
      expect(number().cast(null, { assert: false })).toStrictEqual(NaN)
    })
  })

  it('should handle default', () => {
    const inst = number().default(0)
    expect(inst.defaultValue()).toStrictEqual(0)
    expect(
      inst
        .default(5)
        .required()
        .defaultValue(),
    ).toStrictEqual(5)
  })

  describe('isType', () => {
    it('should type check', () => {
      const inst = number()

      expect(inst.isType(5)).toStrictEqual(true)
      // tslint:disable-next-line:no-construct
      expect(inst.isType(new Number(5))).toStrictEqual(true)
      // tslint:disable-next-line:no-construct
      expect(inst.isType(new Number('foo'))).toStrictEqual(false)
      expect(inst.isType(false)).toStrictEqual(false)
      expect(inst.isType(null)).toStrictEqual(false)
      expect(inst.isType(NaN)).toStrictEqual(false)
      expect(inst.nullable().isType(null)).toStrictEqual(true)
    })
  })

  describe('isValid', () => {
    genIsValid(number(), [0xff, '0xff', [null, number().nullable()]])
    genIsInvalid(number(), [null, ' ', '12abc'])
  })

  describe('min', () => {
    const schema = number().min(5)
    genIsValid(schema, [7, 35738787838, [null, schema.nullable()]])
    genIsInvalid(schema, [2, null, [14, schema.min(10).min(15)]])
  })

  describe('max', () => {
    const schema = number().max(5)
    genIsValid(schema, [4, -5222, [null, schema.nullable()]])
    genIsInvalid(schema, [10, null, [16, schema.max(20).max(15)]])
  })

  describe('lessThan', () => {
    const schema = number().lessThan(5)
    genIsValid(schema, [4, -10, [null, schema.nullable()]])
    genIsInvalid(schema, [5, 7, null, [14, schema.lessThan(10).lessThan(14)]])

    it('should return default message', async () => {
      await expect(schema.validate(6)).rejects.toThrow(/this must be less than 5/)
    })
  })

  describe('moreThan', () => {
    const schema = number().moreThan(5)
    genIsValid(schema, [6, 56445435, [null, schema.nullable()]])
    genIsInvalid(schema, [5, -10, null, [64, schema.moreThan(52).moreThan(74)]])

    it('should return default message', () => {
      return schema
        .validate(4)
        .should.be.rejected.and.eventually.have.property('errors')
        .that.contain('this must be greater than 5')
    })
  })

  describe('integer', () => {
    const schema = number().integer()
    genIsValid(schema, [4, -5222])
    genIsInvalid(schema, [10.53, 0.1 * 0.2, -34512535.626, 3.12312e51, new Date()])
  })

  describe('positive', () => {
    const schema = number().positive()
    genIsValid(schema, [7, 0])
    genIsInvalid(schema, [-4]) // 'this must be a positive number'
  })

  describe('negative', () => {
    const schema = number().positive()
    genIsValid(schema, [-1, 0])
    genIsInvalid(schema, [1]) // 'this must be a negative number'
  })
})
