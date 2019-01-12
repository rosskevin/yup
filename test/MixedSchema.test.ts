// tslint:disable:object-literal-sort-keys

import { array, boolean, mixed, MixedSchema, number, object, reach, ref, string } from 'yup'
import { generateIsValidTests } from './helpers'

const noop = () => true

function ensureSync(fn: any) {
  let run = false
  const resolve = (t: any) => {
    if (!run) {
      return t
    }
    throw new Error('Did not execute synchonously')
  }
  const err = (t: any) => {
    if (!run) {
      throw t
    }
    throw new Error('Did not execute synchonously')
  }

  const result = fn().then(resolve, err)

  run = true
  return result
}

describe('MixedSchema', () => {
  if ((global as any).YUP_USE_SYNC) {
    it('[internal] normal methods should be running in sync Mode', async () => {
      const schema = number()
      await ensureSync(() => Promise.resolve()).should.be.rejected()
      await ensureSync(() => schema.isValid('john')).should.be.become(false)
      const err = await ensureSync(() => schema.validate('john')).should.be.rejected()
      expect(err.message).toMatch(/the final value was: `NaN`.+cast from the value `"john"`/)
    })
  } else {
    // tslint:disable-next-line:no-console
    console.log('Not running in sync mode')
  }

  it('should be immutable', () => {
    const inst = mixed()
    let next: MixedSchema

    // hack this to check to see if props are assigned
    const sub = ((inst as any).sub = mixed())
    expect(inst).not.toStrictEqual((next = inst.required()))
    expect((next as any).sub).toStrictEqual(sub)
    expect((inst as any).sub).toStrictEqual((next as any).sub)

    expect(inst).toBeInstanceOf(MixedSchema)
    expect(next).toBeInstanceOf(MixedSchema)
    // return Promise.all([
    //   inst
    //     .isValid()
    //     .should.eventually()
    //     .equal(true),
    //   next.isValid(null),
    // ])
  })

  it('cast should return a default when undefined', () => {
    const inst = mixed().default('hello')
    expect(inst.cast(undefined)).toStrictEqual('hello')
  })

  it('should validateAt', async () => {
    const schema = object({
      foo: array().of(
        object({
          bar: string().when('loose', {
            is: true,
            otherwise: s => s.strict(),
          }),
          loose: boolean(),
        }),
      ),
    })

    const value = {
      foo: [{ bar: 1 }, { bar: 1, loose: true }],
    }

    expect.assertions(2)
    await expect(schema.validateAt('foo[1].bar', value)).resolves.toBeUndefined()
    await expect(schema.validateAt('foo[0].bar', value)).rejects.toMatch(
      /bar must be a `string` type/,
    )
  })

  it('should limit values', async () => {
    const inst = mixed().oneOf([5, 'hello'])

    expect.assertions(3)
    await expect(inst.isValid(5)).resolves.toStrictEqual(true)
    await expect(inst.isValid('hello')).resolves.toStrictEqual(true)
    await expect(inst.validate(6)).rejects.toEqual({
      errors: ['this must be one of the following values: 5, hello'],
    })
    // expect(err.errors[0]).toStrictEqual('this must be one of the following values: 5, hello')
  })

  it('should not require field when notRequired was set', async () => {
    const inst = mixed().required()
    // FIXME test creep - split it
    expect.assertions(4)
    await expect(inst.isValid('test')).resolves.toStrictEqual(true)
    await expect(inst.isValid(1)).resolves.toStrictEqual(true)
    await expect((inst as any).validate()).rejects.toEqual({ errors: ['this is a required field'] })
    // expect(err.errors[0]).toStrictEqual('this is a required field')
    await expect((inst.notRequired() as any).isValid()).resolves.toStrictEqual(true)
  })

  if ((global as any).YUP_USE_SYNC) {
    describe('synchronous methods', () => {
      it('should throw on async test', async () => {
        const schema = mixed().test({
          message: 'foo',
          name: 'test',
          test: () => Promise.resolve() as any,
        })
        const err = await ensureSync(() => schema.validate('john')).should.be.rejected()
        expect(err.message).toMatch(/Validation test of type: "test"/)
      })
    })
  }

  describe('oneOf', () => {
    const inst = mixed().oneOf(['hello'])

    generateIsValidTests(inst, {
      invalid: [
        'YOLO',
        [undefined, inst.required(), 'required'],
        [null, inst.nullable()],
        [null, inst.nullable().required(), 'required'],
      ],
      valid: [undefined, 'hello'],
    })
  })

  describe('should exclude values', () => {
    const inst = mixed().notOneOf([5, 'hello'])

    generateIsValidTests(inst, {
      invalid: [5, [null, inst.required(), 'required schema']],
      valid: [6, 'hfhfh', [5, inst.oneOf([5]), '`oneOf` called after'], null],
    })

    it('should throw the correct error', async () => {
      expect.assertions(1)
      await expect(inst.validate(5)).rejects.toEqual({
        errors: ['this must not be one of the following values: 5, hello'],
      })
      // expect(err.errors[0]).toStrictEqual('this must not be one of the following values: 5, hello')
    })
  })

  // it('should overload test()', () => {
  //   const inst = mixed().test('test', noop)
  //   expect(inst.tests.length).toStrictEqual(1)
  //   expect((inst.tests[0] as any).TEST_OPTIONS.test).toStrictEqual(noop)
  //   expect((inst.tests[0] as any).TEST_OPTIONS.message).toStrictEqual('${path} is invalid')
  // })

  // it('should allow non string messages', async () => {
  //   const message = { key: 'foo' }
  //   const inst = mixed().test({name: 'test', message, test:  () => false})
  //   expect(inst.tests.length).toStrictEqual(1)
  //   expect(inst.tests[0].TEST_OPTIONS.message).toStrictEqual(message)
  //   const error = await inst.validate('foo').should.be.rejected()
  //   expect(error.message).toStrictEqual(message)
  // })

  it('should dedupe tests with the same test function', () => {
    const inst = mixed()
      .test({ name: 'test', message: ' ', test: noop })
      .test({ name: 'test', message: 'asdasd', test: noop })

    expect(inst.tests.length).toStrictEqual(1)
    expect((inst.tests[0] as any).TEST_OPTIONS.message).toStrictEqual('asdasd')
  })

  it('should not dedupe tests with the same test function and different type', () => {
    const inst = mixed()
      .test({ name: 'test', message: ' ', test: noop })
      .test({ name: 'test-two', message: 'asdasd', test: noop })

    expect(inst.tests.length).toStrictEqual(2)
  })

  it('should respect exclusive validation', () => {
    let inst = mixed()
      .test({
        message: 'invalid',
        exclusive: true,
        name: 'test',
        test: () => true,
      })
      .test({ message: 'also invalid', name: 'test', test: () => true })

    expect(inst.tests.length).toStrictEqual(1)

    inst = mixed()
      .test({ message: 'invalid', name: 'test', test: () => true })
      .test({ message: 'also invalid', name: 'test', test: () => true })

    expect(inst.tests.length).toStrictEqual(2)
  })

  it('should non-exclusive tests should stack', () => {
    const inst = mixed()
      .test({ name: 'test', message: ' ', test: () => true })
      .test({ name: 'test', message: ' ', test: () => true })

    expect(inst.tests.length).toStrictEqual(2)
  })

  it('should replace existing tests, with exclusive test ', () => {
    const inst = mixed()
      .test({ name: 'test', message: ' ', test: noop })
      .test({ name: 'test', exclusive: true, message: ' ', test: noop })

    expect(inst.tests.length).toStrictEqual(1)
  })

  it('should replace existing exclusive tests, with non-exclusive', () => {
    const inst = mixed()
      .test({ name: 'test', exclusive: true, message: ' ', test: () => true })
      .test({ name: 'test', message: ' ', test: () => true })
      .test({ name: 'test', message: ' ', test: () => true })

    expect(inst.tests.length).toStrictEqual(2)
  })

  it('exclusive tests should throw without a name', () => {
    expect(mixed().test({ message: 'invalid', exclusive: true, test: noop } as any)).toThrow()
  })

  it('exclusive tests should replace previous ones', async () => {
    const inst = mixed().test({
      message: 'invalid',
      exclusive: true,
      name: 'max',
      test: v => v < 5,
    })

    expect.assertions(2)
    await expect(inst.isValid(8)).resolves.toStrictEqual(false)
    await expect(
      inst
        .test({
          message: 'invalid',
          exclusive: true,
          name: 'max',
          test: v => v < 10,
        })
        .isValid(8),
    ).resolves.toStrictEqual(true)
  })

  it('tests should be called with the correct `this`', async () => {
    let called = false
    const inst = object({
      other: mixed(),
      test: mixed().test({
        message: 'invalid',
        exclusive: true,
        name: 'max',
        test() {
          expect(this.path).toStrictEqual('test')
          expect(this.parent).toEqual({ other: 5, test: 'hi' })
          expect(this.options.context).toEqual({ user: 'jason' })
          called = true
          return true
        },
      }),
    })

    expect.assertions(1)
    await expect(
      inst.validate({ other: 5, test: 'hi' }, { context: { user: 'jason' } }),
    ).resolves.toStrictEqual(true)
  })

  it('tests can return an error', async () => {
    const inst = mixed().test({
      message: 'invalid ${path}',
      name: 'max',
      test() {
        return this.createError({ path: 'my.path' })
      },
    })

    // return inst
    //   .validate('')
    //   .should.be.rejected()
    //   .then(function(e) {
    //     expect(e.path).toStrictEqual('my.path')
    //     expect(e.errors[0]).toStrictEqual('invalid my.path')
    //   })
    expect.assertions(1)
    await expect(inst.validate('')).rejects.toMatchObject({
      path: 'my.path',
      errors: ['invalid my.path'],
    })
  })

  it('should use returned error path and message', async () => {
    const inst = mixed().test({
      message: 'invalid ${path}',
      name: 'max',
      test() {
        return this.createError({ message: '${path} nope!', path: 'my.path' })
      },
    })

    // return inst
    //   .validate({ other: 5, test: 'hi' })
    //   .should.be.rejected()
    //   .then(function(e) {
    //     expect(e.path).toStrictEqual('my.path')
    //     expect(e.errors[0]).toStrictEqual('my.path nope!')
    //   })
    expect.assertions(1)
    await expect(inst.validate({ other: 5, test: 'hi' })).rejects.toMatchObject({
      path: 'my.path',
      errors: ['my.path nope!'],
    })
  })

  describe('concat', () => {
    let next: MixedSchema
    const inst = object({
      str: string().required(),
      obj: object({
        str: string(),
      }),
    })

    beforeEach(() => {
      next = inst.concat(
        object({
          str: string()
            .required()
            .trim(),
          str2: string().required(),
          obj: object({
            str: string().required(),
          }),
        }),
      )
    })

    it('should have the correct number of tests', () => {
      expect(reach(next, 'str').tests.length).toStrictEqual(3) // presence, alt presence, and trim
    })

    it('should have the tests in the correct order', () => {
      expect((reach(next, 'str').tests[0] as any).TEST_OPTIONS.name).toStrictEqual('required')
    })

    it('should validate correctly', async () => {
      expect.assertions(2)
      await expect(inst.isValid({ str: 'hi', str2: 'hi', obj: {} })).resolves.toStrictEqual(true)
      await expect(
        next.validate({ str: ' hi  ', str2: 'hi', obj: { str: 'hi' } }),
      ).resolves.toMatchObject({
        str: 'hi',
        str2: 'hi',
        obj: { str: 'hi' },
      })
    })

    it('should throw the correct validation errors', async () => {
      expect.assertions(2)
      await expect(next.validate({ str: 'hi', str2: 'hi', obj: {} })).rejects.toMatchObject({
        message: 'obj.str is a required field',
      })

      await expect(next.validate({ str2: 'hi', obj: { str: 'hi' } })).rejects.toMatchObject({
        mesage: 'str is a required field',
      })
    })
  })

  it('concat should allow mixed and other type', async () => {
    expect.assertions(1)
    await expect(
      mixed()
        .default('hi')
        .concat(string())._type,
    ).resolves.toStrictEqual('string')
  })

  describe('conditionals', () => {
    it('should is (literal)/then (schema)', async () => {
      const inst = mixed().when('prop', {
        is: 5,
        then: mixed().required('from parent'),
      })

      expect.assertions(3)
      await expect(inst.validate(undefined, { parent: { prop: 5 } })).rejects
      await expect(inst.validate(undefined, { parent: { prop: 1 } })).resolves
      await expect(inst.validate('hello', { parent: { prop: 5 } })).resolves
    })

    it('should handle is (fn)/then (schema)/otherwise (schema)', async () => {
      const inst = string().when('prop', {
        is(val) {
          return val === 5
        },
        then: string().required(),
        otherwise: string().min(4),
      })

      expect.assertions(3)
      await expect(inst.validate(undefined, { parent: { prop: 5 } })).rejects
      await expect(inst.validate('hello', { parent: { prop: 1 } })).resolves
      await expect(inst.validate('hel', { parent: { prop: 1 } })).rejects
    })

    it('should handle multiple when args with fn', () => {
      let called = false
      const inst = mixed().when(
        ['prop', 'other'],
        (prop, other): boolean => {
          expect(other).toStrictEqual(true)
          expect(prop).toStrictEqual(1)
          called = true
          return true
        },
      )

      inst.cast({}, { context: { prop: 1, other: true } })
      expect(called).toStrictEqual(true)
    })

    it('should handle multiple when args with is (literal)/then (schema)', async () => {
      const inst = mixed().when(['prop', 'other'], {
        is: 5,
        then: mixed().required(),
      })

      await expect(
        inst.isValid(undefined, { context: { prop: 5, other: 5 } }),
      ).resolves.toStrictEqual(false)
    })

    it('should require context is (literal)/then (schema)', async () => {
      const inst = mixed().when('$prop', {
        is: 5,
        then: mixed().required('from context'),
      })

      expect.assertions(3)
      await expect(inst.validate(undefined, { context: { prop: 5 } })).rejects
      await expect(inst.validate(undefined, { context: { prop: 1 } })).resolves
      await expect(inst.validate('hello', { context: { prop: 5 } })).resolves
    })

    it('should require context is (fn)/then (schema)/otherwise (schema)', async () => {
      const inst = string().when('$prop', {
        is(val) {
          return val === 5
        },
        then: string().required(),
        otherwise: string().min(4),
      })

      expect.assertions(3)
      await expect(inst.validate(undefined, { context: { prop: 5 } })).rejects
      await expect(inst.validate('hello', { context: { prop: 1 } })).resolves
      await expect(inst.validate('hel', { context: { prop: 1 } })).rejects
    })
  })

  it('should not use context refs in object calculations', () => {
    const inst = object({
      prop: string().when('$prop', {
        is: 5,
        then: string().required('from context'),
      }),
    })

    expect(inst.defaultValue()).toEqual({ prop: undefined })
  })

  it('should use label in error message', async () => {
    const label = 'Label'
    const inst = object({
      prop: string()
        .required()
        .label(label),
    })

    expect.assertions(1)
    await expect(inst.validate({})).rejects.toMatchObject({
      message: `${label} is a required field`,
    })
  })

  it('should add meta() data', () => {
    expect(
      string()
        .meta({ input: 'foo' })
        .meta({ foo: 'bar' })
        .meta(),
    ).toMatchObject({
      input: 'foo',
      foo: 'bar',
    })
  })

  it('should describe', () => {
    const desc = object({
      foos: array(number().integer()).required(),
      foo: string()
        .max(2)
        .meta({ input: 'foo' })
        .label('str!'),
    }).describe()

    expect(desc).toMatchObject({
      type: 'object',
      meta: undefined,
      label: undefined,
      tests: [],
      fields: {
        foos: {
          type: 'array',
          meta: undefined,
          label: undefined,
          tests: ['required'],
          innerType: {
            type: 'number',
            meta: undefined,
            label: undefined,
            tests: ['integer'],
          },
        },
        foo: {
          type: 'string',
          label: 'str!',
          tests: ['max'],
          meta: {
            input: 'foo',
          },
        },
      },
    })
  })
})
