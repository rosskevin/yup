import { MessageFormatterParams, number, object, ref, string } from 'yup'
import {
  genCastInvalid,
  genCastValid,
  genIsInvalid,
  genIsNotType,
  genIsType,
  genIsValid,
} from './helpers'

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

    await expect(inst.validate(5)).rejects.toThrow(/must be a string!/)
    await expect(inst.validate(5, { abortEarly: false })).rejects.toThrow(/must be a string!/)
  })

  it('should allow function messages', async () => {
    expect.assertions(1)
    await expect(
      string()
        .label('My string')
        .required((d: MessageFormatterParams) => `${d.label} is required`)
        .validate(null),
    ).rejects.toThrow(/My string must be a `string` type, but the final value was: `null`/)
  })

  it('should return the defaultValue from conditional evaluating context', () => {
    const inst = string().when('$foo', {
      is: 'greet',
      then: string().default('hi'),
    })
    const resolvedSchema = inst.resolve({ context: { foo: 'greet' } })
    expect(resolvedSchema.defaultValue()).toStrictEqual('hi')
  })

  describe('strict', () => {
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

    it('should respect abortEarly', async () => {
      const inst = string()
        .trim()
        .min(10)
      expect.assertions(2)
      await expect(inst.strict().validate(' hi ')).rejects.toMatchObject({
        errors: [{ message: 'FIXME 1' }],
      })

      await expect(inst.strict().validate(' hi ', { abortEarly: false })).rejects.toMatchObject({
        errors: [{ message: 'FIXME 1' }, { message: 'FIXME 2' }],
      })
    })
  })

  it('should allow custom validation', async () => {
    const inst = string().test({ name: 'name', message: 'test a', test: val => val === 'jim' })
    await expect(inst.validate('joe')).rejects.toMatchObject({ errors: [{ message: 'test a' }] })
  })

  describe('concat', () => {
    it('concat should fail on different types', () => {
      const inst = string().default('hi')
      expect(inst.concat(object() as any)).toThrow(TypeError)
    })
  })
  describe('default/defaultValue', () => {
    it('concat should maintain undefined defaults', () => {
      expect(
        string()
          .default('hi')
          .concat(string().default(undefined))
          .defaultValue(),
      ).toBeUndefined()
    })
    it('defaults should be validated but not transformed', async () => {
      expect.assertions(1)
      await expect(
        string()
          .trim()
          .default('  hi  ')
          .validate(undefined),
      ).rejects.toThrow(/this must be a trimmed string/)
    })
  })

  describe('cast', () => {
    genCastInvalid(string(), [null])
    genCastValid(string(), [
      [5, '5'],
      ['3', '3'],
      // [new String('foo'), 'foo'],
      ['', ''],
      [true, 'true'],
      [false, 'false'],
      [0, '0'],
      [null, null, string().nullable()],
    ])

    it('cast should not assert on undefined', () => {
      expect(string().cast(undefined)).not.toThrow()
    })

    describe('ensure', () => {
      const schema = string().ensure()
      genCastValid(schema, [
        [5, '5'],
        ['3', '3'],
        [null, ''],
        [undefined, ''],
        [null, '', schema.default('foo')],
        [undefined, 'foo', schema.default('foo')],
      ])
    })

    it('should trim', () => {
      expect(
        string()
          .trim()
          .cast(' 3  '),
      ).toStrictEqual('3')
    })

    it('should transform to lowercase', () => {
      expect(
        string()
          .lowercase()
          .cast('HellO JohN'),
      ).toStrictEqual('hello john')
    })

    it('should transform to uppercase', () => {
      expect(
        string()
          .uppercase()
          .cast('HellO JohN'),
      ).toStrictEqual('HELLO JOHN')
    })

    it('should handle nulls', () => {
      expect(
        string()
          .nullable()
          .trim()
          .lowercase()
          .uppercase()
          .cast(null),
      ).toBeNull()
    })

    it('cast should assert on undefined cast results', () => {
      expect(
        string()
          .transform(() => undefined)
          .cast('foo'),
      ).toThrow()
    })

    it('cast should respect assert option', () => {
      expect(string().cast(null)).toThrow()
      expect(string().cast(null, { assert: false })).not.toThrow()
    })
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

  describe('isValid', () => {
    genIsInvalid(string().strict(), [null])
    genIsValid(
      string()
        .strict()
        .nullable(true),
      [null],
    )
  })

  it('validate', async () => {
    expect.assertions(1)
    await expect(
      string()
        .required()
        .min(4)
        .strict()
        .validate(''),
    ).rejects.toMatchObject({ errors: [{ message: 'FIXME' }] })
  })

  describe('matches', () => {
    genIsValid(string().matches(/(hi|bye)/), ['hi', 'bye'])
    genIsInvalid(string().matches(/(hi|bye)/), ['nope', ''])

    describe('should exclude empty strings', () => {
      genIsValid(string().matches(/(hi|bye)/, { excludeEmptyString: true }), [''])
    })
  })

  describe('should exclude empty strings', () => {
    genIsValid(string().email(), [''])
  })

  describe('min', () => {
    genIsValid(string().min(5), ['hiiofff', 'noffasfasfasf saf'])
    genIsInvalid(string().min(5), ['big', null])
    genIsValid(
      string()
        .min(5)
        .nullable(),
      [null],
    )
  })

  describe('max', () => {
    genIsValid(string().max(5), ['adgf', 'no'])
    genIsInvalid(string().max(5), ['bigdfdsfsdf', null])
    genIsValid(
      string()
        .max(5)
        .nullable(),
      [null],
    )
  })

  it('length', () => {
    genIsValid(string().length(5), ['exact'])
    genIsInvalid(string().length(5), ['sml', 'biiiig', null])
    genIsValid(
      string()
        .length(5)
        .nullable(),
      [null],
    )
  })

  describe('url', () => {
    genIsValid(string().url(), [
      '//www.github.com/',
      'https://www.github.com/',
      'http://www.github.com/',
    ])
    genIsInvalid(string().url(), ['this is not a url', null])
  })

  describe('trim', () => {
    genIsValid(string().trim(), ['  3  '])
  })

  describe('lowercase', () => {
    genIsValid(string().lowercase(), ['HellO JohN'])
  })

  describe('uppercase', () => {
    genIsValid(string().uppercase(), ['HellO JohN'])
  })

  it('isValid strict', async () => {
    await expect(
      string()
        .trim()
        .isValid(' 3  ', { strict: true }),
    ).resolves.toStrictEqual(true)

    await expect(
      string()
        .lowercase()
        .isValid('HellO JohN', { strict: true }),
    ).resolves.toStrictEqual(false)

    await expect(
      string()
        .uppercase()
        .isValid('HellO JohN', { strict: true }),
    ).resolves.toStrictEqual(false)
  })
})
