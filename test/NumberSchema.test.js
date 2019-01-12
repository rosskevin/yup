import { generateCastTests, generateIsValidTests } from './helpers'
import { number, NumberSchema } from 'yup'

describe('NumberSchema', function() {
  it('is newable', () => {
    let schema = new number()
    schema.integer().required()
  })

  it('should print the original value', async () => {
    let error = await number()
      .validate('john')
      .should.be.rejected()

    expect(error.message).toMatch(/the final value was: `NaN`.+cast from the value `"john"`/)
  })

  if (global.YUP_USE_SYNC) {
    describe('synchronous methods', () => {
      it('should validate synchronously', async () => {
        let schema = number()

        expect(schema.isValidSync('john')).toStrictEqual(false)

        expect(() => schema.validateSync('john')).toThrow(
          /the final value was: `NaN`.+cast from the value `"john"`/,
        )
      })

      it('should isValid synchronously', async () => {
        let schema = number()

        expect(schema.isValidSync('john')).toStrictEqual(false)
      })
    })
  }
  it('is extensible', () => {
    class MyNumber extends NumberSchema {
      foo() {
        return this
      }
    }

    new MyNumber()
      .foo()
      .integer()
      .required()
  })

  describe('casting', () => {
    let schema = number()

    generateCastTests(schema, {
      valid: [
        ['5', 5],
        [3, 3],
        //[new Number(5), 5],
        [' 5.656 ', 5.656],
      ],
      invalid: ['', false, true, new Date(), new Number('foo')],
    })

    it('should round', () => {
      schema.round('floor').cast(45.99999)
      expect().toStrictEqual(45)
      schema.round('ceIl').cast(45.1111)
      expect().toStrictEqual(46)
      schema.round().cast(45.444444)
      expect().toStrictEqual(45)

      expect(
        schema
          .nullable()
          .integer()
          .round()
          .cast(null),
      ).toStrictEqual(null)
      ;(function() {
        schema.round('fasf')
      }.should.throw(TypeError))
    })

    it('should truncate', () => {
      schema.truncate().cast(45.55)
      expect().toStrictEqual(45)
    })

    it('should return NaN for failed casts', () => {
      expect(number().cast('asfasf', { assert: false })).toStrictEqual(NaN)

      expect(number().cast(null, { assert: false })).toStrictEqual(NaN)
    })
  })

  it('should handle DEFAULT', function() {
    var inst = number().default(0)

    expect(inst.default()).toStrictEqual(0)
    inst
      .default(5)
      .required()
      .default()
    expect().toStrictEqual(5)
  })

  it('should type check', function() {
    var inst = number()

    expect(inst.isType(5)).toStrictEqual(true)
    expect(inst.isType(new Number(5))).toStrictEqual(true)
    expect(inst.isType(new Number('foo'))).toStrictEqual(false)
    expect(inst.isType(false)).toStrictEqual(false)
    expect(inst.isType(null)).toStrictEqual(false)
    expect(inst.isType(NaN)).toStrictEqual(false)
    inst.nullable().isType(null)
    expect().toStrictEqual(true)
  })

  it('should VALIDATE correctly', function() {
    var inst = number()
      .required()
      .min(4)

    return Promise.all([
      number()
        .isValid(null)
        .should.eventually()
        .equal(false),
      number()
        .nullable()
        .isValid(null)
        .should.eventually()
        .equal(true),
      number()
        .isValid(' ')
        .should.eventually()
        .equal(false),
      number()
        .isValid('12abc')
        .should.eventually()
        .equal(false),
      number()
        .isValid(0xff)
        .should.eventually.equal(true),
      number()
        .isValid('0xff')
        .should.eventually.equal(true),

      inst
        .isValid(5)
        .should.eventually()
        .equal(true),
      inst
        .isValid(2)
        .should.eventually()
        .equal(false),

      inst
        .validate()
        .should.be.rejected()
        .then(function(err) {
          expect(err.errors.length).toStrictEqual(1)
          err.errors[0].should.contain('required')
        }),
    ])
  })

  describe('min', () => {
    var schema = number().min(5)

    generateIsValidTests(schema, {
      valid: [7, 35738787838, [null, schema.nullable()]],
      invalid: [2, null, [14, schema.min(10).min(15)]],
    })
  })

  describe('max', () => {
    var schema = number().max(5)

    generateIsValidTests(schema, {
      valid: [4, -5222, [null, schema.nullable()]],
      invalid: [10, null, [16, schema.max(20).max(15)]],
    })
  })

  describe('lessThan', () => {
    var schema = number().lessThan(5)

    generateIsValidTests(schema, {
      valid: [4, -10, [null, schema.nullable()]],
      invalid: [5, 7, null, [14, schema.lessThan(10).lessThan(14)]],
    })

    it('should return default message', () => {
      return schema
        .validate(6)
        .should.be.rejected.and.eventually.have.property('errors')
        .that.contain('this must be less than 5')
    })
  })

  describe('moreThan', () => {
    var schema = number().moreThan(5)

    generateIsValidTests(schema, {
      valid: [6, 56445435, [null, schema.nullable()]],
      invalid: [5, -10, null, [64, schema.moreThan(52).moreThan(74)]],
    })

    it('should return default message', () => {
      return schema
        .validate(4)
        .should.be.rejected.and.eventually.have.property('errors')
        .that.contain('this must be greater than 5')
    })
  })

  describe('integer', () => {
    generateIsValidTests(number().integer(), {
      valid: [4, -5222],
      invalid: [10.53, 0.1 * 0.2, -34512535.626, 3.12312e51, new Date()],
    })
  })
  it('should check integer', function() {
    var v = number().positive()

    return Promise.all([
      v
        .isValid(7)
        .should.eventually()
        .equal(true),

      v
        .isValid(0)
        .should.eventually()
        .equal(true),

      v
        .validate(-4)
        .should.be.rejected()
        .then(null, function(err) {
          err.errors[0].should.contain('this must be a positive number')
        }),
    ])
  })

  it('should check POSITIVE correctly', function() {
    var v = number().positive()

    return Promise.all([
      v
        .isValid(7)
        .should.eventually()
        .equal(true),

      v
        .isValid(0)
        .should.eventually()
        .equal(true),

      v
        .validate(-4)
        .should.be.rejected()
        .then(null, function(err) {
          err.errors[0].should.contain('this must be a positive number')
        }),
    ])
  })

  it('should check NEGATIVE correctly', function() {
    var v = number().negative()

    return Promise.all([
      v
        .isValid(-4)
        .should.eventually()
        .equal(true),

      v
        .isValid(0)
        .should.eventually()
        .equal(true),

      v
        .validate(10)
        .should.be.rejected()
        .then(null, function(err) {
          err.errors[0].should.contain('this must be a negative number')
        }),
    ])
  })
})
