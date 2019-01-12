import { MessageFormatterParams, number, object, ref, string } from 'yup'
import { genCastInvalid, genCastValid, genIsNotType, genIsType } from './helpers'

describe('StringSchema', () => {
  describe('default/defaultValue', () => {
    it('should work', () => {
      expect(
        string()
          .default('hi')
          .defaultValue(),
      ).toStrictEqual('hi')
    })
  })

  it('strict should assert types', async () => {
    const inst = string()
      .strict()
      .typeError('must be a ${type}!')

    expect.assertions(2)

    await expect(inst.validate(5)).rejects.toMatchObject({
      inner: [],
      message: 'must be a string!',
      type: 'typeError',
    })

    await expect(inst.validate(5, { abortEarly: false })).rejects.toMatchObject({
      inner: [],
      message: 'must be a string!',
      type: undefined,
    })
  })

  it('should allow function messages', async () => {
    expect.assertions(1)
    await expect(
      string()
        .label('My string')
        .required((d: MessageFormatterParams) => `${d.label} is required`)
        .validate(null),
    ).rejects.toThrow(/My string is required/)
  })

  it('should return the default value using context', () => {
    const inst = string().when('$foo', {
      is: 'greet',
      then: string().default('hi'),
    })
    expect(inst.resolve({ context: { foo: 'greet' } }).defaultValue()).toStrictEqual('hi')
  })

  it('should warn about null types', async () => {
    expect.assertions(1)
    await expect(
      string()
        .strict()
        .validate(null),
    ).rejects.toThrow(/If "null" is intended/)
  })

  it('should run subset of validations first', async () => {
    let called = false
    const inst = string()
      .strict()
      .test({ name: 'test', message: 'boom', test: () => (called = true) })

    expect.assertions(1)
    await expect(inst.validate(25)).rejects

    expect(called).toStrictEqual(false)
  })

  it('should respect strict', async () => {
    const inst = string().equals(['hello', '5'])

    expect.assertions(2)
    expect(inst.isValid(5)).resolves.toStrictEqual(true)
    expect(inst.strict().isValid(5)).resolves.toStrictEqual(false)
  })

  it('should respect abortEarly', () => {
    const inst = string()
      .trim()
      .min(10)

    return Promise.all([
      inst
        .strict()
        .validate(' hi ')
        .should.be.rejected()
        .then(err => {
          expect(err.errors.length).toStrictEqual(1)
        }),

      inst
        .strict()
        .validate(' hi ', { abortEarly: false })
        .should.be.rejected()
        .then(err => {
          expect(err.errors.length).toStrictEqual(2)
        }),
    ])
  })

  it('should allow custom validation', async () => {
    const inst = string().test('name', 'test a', val => val === 'jim')

    return inst
      .validate('joe')
      .should.be.rejected()
      .then(e => {
        expect(e.errors[0]).toStrictEqual('test a')
      })
  })

  it('concat should fail on different types', () => {
    const inst = string().default('hi')
    ; (function() {
      inst.concat(object())
    }.should.throw(TypeError))
  })

  it('concat should maintain undefined defaults', () => {
    const inst = string().default('hi')

    expect(inst.concat(string().default(undefined)).default()).toStrictEqual(undefined)
  })

  it('defaults should be validated but not transformed', () => {
    const inst = string()
      .trim()
      .default('  hi  ')

    return inst
      .validate(undefined)
      .should.be.rejected()
      .then(function(err) {
        expect(err.message).toStrictEqual('this must be a trimmed string')
      })
  })

  describe('casting', () => {
    const schema = string()

    genCast(schema, {
      valid: [
        [5, '5'],
        ['3', '3'],
        // [new String('foo'), 'foo'],
        ['', ''],
        [true, 'true'],
        [false, 'false'],
        [0, '0'],
        [null, null, schema.nullable()],
      ],
      invalid: [null],
    })

    describe('ensure', () => {
      const schema = string().ensure()

      genCast(schema, {
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
      schema.trim().cast(' 3  ')
      expect().toStrictEqual('3')
    })

    it('should transform to lowercase', () => {
      schema.lowercase().cast('HellO JohN')
      expect().toStrictEqual('hello john')
    })

    it('should transform to uppercase', () => {
      schema.uppercase().cast('HellO JohN')
      expect().toStrictEqual('HELLO JOHN')
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

  it('should handle DEFAULT', () => {
    const inst = string()

    inst
      .default('my_value')
      .required()
      .default()
    expect().toStrictEqual('my_value')
  })

  describe('isType', () => {
    genIsNotType(string(), [false, null])
    // tslint:disable-next-line:no-construct
    genIsType(string(), ['5', new String('5')])
    it('nullable should work', () => {
      expect(
        string()
          .nullable(false)
          .isType(null),
      ).toStrictEqual(false)
    })
  })

  it('should VALIDATE correctly', () => {
    const inst = string()
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
          expect(err.errors.length).toStrictEqual(1)
        }),
    ])
  })

  it('should check MATCHES correctly', () => {
    const v = string().matches(/(hi|bye)/)

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
    const v = string().matches(/(hi|bye)/)

    return v
      .isValid('')
      .should.eventually()
      .equal(false)
  })

  it('MATCHES should exclude empty strings', () => {
    const v = string().matches(/(hi|bye)/, { excludeEmptyString: true })

    return v
      .isValid('')
      .should.eventually()
      .equal(true)
  })

  it('EMAIL should exclude empty strings', () => {
    const v = string().email()

    return v
      .isValid('')
      .should.eventually()
      .equal(true)
  })

  it('should check MIN correctly', () => {
    const v = string().min(5)
    const obj = object({
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

  it('should check MAX correctly', () => {
    const v = string().max(5)
    const obj = object({
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

  it('should check LENGTH correctly', () => {
    const v = string().length(5)
    const obj = object({
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

  it('should check url correctly', () => {
    const v = string().url()

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

  it('should validate transforms', () => {
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
