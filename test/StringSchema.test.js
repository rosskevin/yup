import { string, number, object, ref } from '../src'
import { generateCastTests } from './helpers'

describe('StringSchema', () => {
  it('is constructed properly', () => {
    const schema = string()
    schema.stripped()
  })

  it('getDefault should return the default value', function() {
    let inst = string().default('hi')
    inst.getDefault({}).should.equal('hi')
    inst.getDefault().should.equal('hi')
  })

  it('should check types', async () => {
    let inst = string()
      .strict()
      .typeError('must be a ${type}!')

    let error = await inst.validate(5).should.be.rejected()

    expect(error.type).toStrictEqual('typeError')
    expect(error.message).toStrictEqual('must be a string!')
    expect(error.inner.length).toStrictEqual(0)

    error = await inst.validate(5, { abortEarly: false }).should.be.rejected()

    expect(error.type).toStrictEqual(undefined)
    expect(error.message).toStrictEqual('must be a string!')
    expect(error.inner.length).toStrictEqual(1)
  })

  it('should allow function messages', async () => {
    let error = await string()
      .label('My string')
      .required(d => `${d.label} is required`)
      .validate()
      .should.be.rejected()

    expect(error.message).toMatch(/My string is required/)
  })

  it('getDefault should return the default value using context', function() {
    let inst = string().when('$foo', {
      is: 'greet',
      then: string().default('hi'),
    })
    inst.getDefault({ context: { foo: 'greet' } }).should.equal('hi')
  })

  it('should warn about null types', async () => {
    let error = await string()
      .strict()
      .validate(null)
      .should.be.rejected()

    expect(error.message).toMatch(/If "null" is intended/)
  })

  it('should run subset of validations first', () => {
    let called = false
    let inst = string()
      .strict()
      .test('test', 'boom', () => (called = true))

    return inst
      .validate(25)
      .should.be.rejected()
      .then(() => {
        called.should.equal(false)
      })
  })

  it('should respect strict', () => {
    let inst = string().equals(['hello', '5'])

    return Promise.all([
      inst
        .isValid(5)
        .should.eventually()
        .equal(true),
      inst
        .strict()
        .isValid(5)
        .should.eventually()
        .equal(false),
    ])
  })

  it('should respect abortEarly', () => {
    let inst = string()
      .trim()
      .min(10)

    return Promise.all([
      inst
        .strict()
        .validate(' hi ')
        .should.be.rejected()
        .then(err => {
          err.errors.length.should.equal(1)
        }),

      inst
        .strict()
        .validate(' hi ', { abortEarly: false })
        .should.be.rejected()
        .then(err => {
          err.errors.length.should.equal(2)
        }),
    ])
  })

  it('should allow custom validation', async () => {
    let inst = string().test('name', 'test a', val => val === 'jim')

    return inst
      .validate('joe')
      .should.be.rejected()
      .then(e => {
        e.errors[0].should.equal('test a')
      })
  })

  it('concat should fail on different types', function() {
    let inst = string().default('hi')

    ;(function() {
      inst.concat(object())
    }.should.throw(TypeError))
  })

  it('concat should maintain undefined defaults', function() {
    let inst = string().default('hi')

    expect(inst.concat(string().default(undefined)).default()).toStrictEqual(undefined)
  })

  it('defaults should be validated but not transformed', function() {
    let inst = string()
      .trim()
      .default('  hi  ')

    return inst
      .validate(undefined)
      .should.be.rejected()
      .then(function(err) {
        err.message.should.equal('this must be a trimmed string')
      })
  })

  describe('casting', () => {
    let schema = string()

    generateCastTests(schema, {
      valid: [
        [5, '5'],
        ['3', '3'],
        //[new String('foo'), 'foo'],
        ['', ''],
        [true, 'true'],
        [false, 'false'],
        [0, '0'],
        [null, null, schema.nullable()],
      ],
      invalid: [null],
    })

    describe('ensure', () => {
      let schema = string().ensure()

      generateCastTests(schema, {
        valid: [
          [5, '5'],
          ['3', '3'],
          [null, ''],
          [undefined, ''],
          [null, '', schema.default('foo')],
          [undefined, 'foo', schema.default('foo')],
        ],
      })
    })

    it('should trim', () => {
      schema
        .trim()
        .cast(' 3  ')
        .should.equal('3')
    })

    it('should transform to lowercase', () => {
      schema
        .lowercase()
        .cast('HellO JohN')
        .should.equal('hello john')
    })

    it('should transform to uppercase', () => {
      schema
        .uppercase()
        .cast('HellO JohN')
        .should.equal('HELLO JOHN')
    })

    it('should handle nulls', () => {
      expect(
        schema
          .nullable()
          .trim()
          .lowercase()
          .uppercase()
          .cast(null),
      ).toStrictEqual(null)
    })
  })

  it('should handle DEFAULT', function() {
    var inst = string()

    inst
      .default('my_value')
      .required()
      .default()
      .should.equal('my_value')
  })

  it('should type check', function() {
    var inst = string()

    inst.isType('5').should.equal(true)
    inst.isType(new String('5')).should.equal(true)
    inst.isType(false).should.equal(false)
    inst.isType(null).should.equal(false)
    inst
      .nullable(false)
      .isType(null)
      .should.equal(false)
  })

  it('should VALIDATE correctly', function() {
    var inst = string()
      .required()
      .min(4)
      .strict()

    return Promise.all([
      string()
        .strict()
        .isValid(null)
        .should.eventually()
        .equal(false),

      string()
        .strict()
        .nullable(true)
        .isValid(null)
        .should.eventually()
        .equal(true),

      inst
        .isValid('hello')
        .should.eventually()
        .equal(true),

      inst
        .isValid('hel')
        .should.eventually()
        .equal(false),

      inst
        .validate('')
        .should.be.rejected()
        .then(function(err) {
          err.errors.length.should.equal(1)
        }),
    ])
  })

  it('should check MATCHES correctly', function() {
    var v = string().matches(/(hi|bye)/)

    return Promise.all([
      v
        .isValid('hi')
        .should.eventually()
        .equal(true),
      v
        .isValid('nope')
        .should.eventually()
        .equal(false),
      v
        .isValid('bye')
        .should.eventually()
        .equal(true),
    ])
  })

  it('MATCHES should include empty strings', () => {
    let v = string().matches(/(hi|bye)/)

    return v
      .isValid('')
      .should.eventually()
      .equal(false)
  })

  it('MATCHES should exclude empty strings', () => {
    let v = string().matches(/(hi|bye)/, { excludeEmptyString: true })

    return v
      .isValid('')
      .should.eventually()
      .equal(true)
  })

  it('EMAIL should exclude empty strings', () => {
    let v = string().email()

    return v
      .isValid('')
      .should.eventually()
      .equal(true)
  })

  it('should check MIN correctly', function() {
    var v = string().min(5)
    var obj = object({
      len: number(),
      name: string().min(ref('len')),
    })

    return Promise.all([
      v
        .isValid('hiiofff')
        .should.eventually()
        .equal(true),
      v
        .isValid('big')
        .should.eventually()
        .equal(false),
      v
        .isValid('noffasfasfasf saf')
        .should.eventually()
        .equal(true),

      v
        .isValid(null)
        .should.eventually()
        .equal(false), // null -> ''
      v
        .nullable()
        .isValid(null)
        .should.eventually()
        .equal(true), // null -> null

      obj
        .isValid({ len: 10, name: 'john' })
        .should.eventually()
        .equal(false),
    ])
  })

  it('should check MAX correctly', function() {
    var v = string().max(5)
    var obj = object({
      len: number(),
      name: string().max(ref('len')),
    })
    return Promise.all([
      v
        .isValid('adgf')
        .should.eventually()
        .equal(true),
      v
        .isValid('bigdfdsfsdf')
        .should.eventually()
        .equal(false),
      v
        .isValid('no')
        .should.eventually()
        .equal(true),

      v
        .isValid(null)
        .should.eventually()
        .equal(false),

      v
        .nullable()
        .isValid(null)
        .should.eventually()
        .equal(true),

      obj
        .isValid({ len: 3, name: 'john' })
        .should.eventually()
        .equal(false),
    ])
  })

  it('should check LENGTH correctly', function() {
    var v = string().length(5)
    var obj = object({
      len: number(),
      name: string().length(ref('len')),
    })

    return Promise.all([
      v
        .isValid('exact')
        .should.eventually()
        .equal(true),
      v
        .isValid('sml')
        .should.eventually()
        .equal(false),
      v
        .isValid('biiiig')
        .should.eventually()
        .equal(false),

      v
        .isValid(null)
        .should.eventually()
        .equal(false),
      v
        .nullable()
        .isValid(null)
        .should.eventually()
        .equal(true),

      obj
        .isValid({ len: 5, name: 'foo' })
        .should.eventually()
        .equal(false),
    ])
  })

  it('should check url correctly', function() {
    var v = string().url()

    return Promise.all([
      v
        .isValid('//www.github.com/')
        .should.eventually()
        .equal(true),
      v
        .isValid('https://www.github.com/')
        .should.eventually()
        .equal(true),
      v
        .isValid('this is not a url')
        .should.eventually()
        .equal(false),
    ])
  })

  it('should validate transforms', function() {
    return Promise.all([
      string()
        .trim()
        .isValid(' 3  ')
        .should.eventually()
        .equal(true),

      string()
        .lowercase()
        .isValid('HellO JohN')
        .should.eventually()
        .equal(true),

      string()
        .uppercase()
        .isValid('HellO JohN')
        .should.eventually()
        .equal(true),

      string()
        .trim()
        .isValid(' 3  ', { strict: true })
        .should.eventually()
        .equal(false),

      string()
        .lowercase()
        .isValid('HellO JohN', { strict: true })
        .should.eventually()
        .equal(false),

      string()
        .uppercase()
        .isValid('HellO JohN', { strict: true })
        .should.eventually()
        .equal(false),
    ])
  })
})
