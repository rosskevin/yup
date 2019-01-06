import { array, boolean, mixed, MixedSchema, number, object, reach, ref, string } from '../src'
const noop = () => {}

function ensureSync(fn) {
  let run = false
  const resolve = t => {
    if (!run) {
      return t
    }
    throw new Error('Did not execute synchonously')
  }
  const err = t => {
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
  it('[internal] normal methods should be running in sync Mode', async () => {
    if (global.YUP_USE_SYNC) {
      const schema = number()
      await ensureSync(() => Promise.resolve()).should.be.rejected()
      await ensureSync(() => schema.isValid('john')).should.be.become(false)
      const err = await ensureSync(() => schema.validate('john')).should.be.rejected()
      expect(err.message).toMatch(/the final value was: `NaN`.+cast from the value `"john"`/)
    } else {
      console.log('Not running in sync mode')
    }
  })
  it('should be immutable', () => {
    let inst = mixed(),
      next
    const sub = (inst.sub = mixed())

    inst.should.not.equal((next = inst.required()))

    next.sub.should.equal(sub)
    inst.sub.should.equal(next.sub)

    inst.should.be.an.instanceOf(MixedSchema)
    next.should.be.an.instanceOf(MixedSchema)

    return Promise.all([
      inst
        .isValid()
        .should.eventually()
        .equal(true),
      next.isValid(null),
    ])
  })

  it('cast should return a default when undefined', () => {
    const inst = mixed().default('hello')

    inst.cast(undefined).should.equal('hello')
  })

  it('should validateAt', async () => {
    const schema = object({
      foo: array().of(
        object({
          loose: boolean(),
          bar: string().when('loose', {
            is: true,
            otherwise: s => s.strict(),
          }),
        }),
      ),
    })
    const value = {
      foo: [{ bar: 1 }, { bar: 1, loose: true }],
    }

    await schema.validateAt('foo[1].bar', value).should.be.fulfilled()

    const err = await schema.validateAt('foo[0].bar', value).should.be.rejected()

    expect(err.message).toMatch(/bar must be a `string` type/)
  })

  // xit('should castAt', async () => {
  //   const schema = object({
  //     foo: array().of(
  //       object({
  //         loose: boolean().default(true),
  //         bar: string(),
  //       }),
  //     ),
  //   });
  //   const value = {
  //     foo: [{ bar: 1 }, { bar: 1, loose: true }],
  //   };

  //   schema.castAt('foo[1].bar', value).should.equal('1');

  //   schema.castAt('foo[0].loose', value).should.equal(true);
  // });

  it('should limit values', async () => {
    const inst = mixed().oneOf([5, 'hello'])

    await inst
      .isValid(5)
      .should.eventually()
      .equal(true)
    await inst
      .isValid('hello')
      .should.eventually()
      .equal(true)

    const err = await inst.validate(6).should.be.rejected()

    err.errors[0].should.equal('this must be one of the following values: 5, hello')
  })

  it('should not require field when notRequired was set', async () => {
    let inst = mixed().required()

    await inst
      .isValid('test')
      .should.eventually()
      .equal(true)
    await inst.isValid(1).should.eventually.equal(true)

    const err = await inst.validate().should.be.rejected()

    err.errors[0].should.equal('this is a required field')

    inst = inst.notRequired()

    await inst.isValid().should.eventually.equal(true)
  })

  if (global.YUP_USE_SYNC) {
    describe('synchronous methods', () => {
      it('should throw on async test', async () => {
        const schema = mixed().test('test', 'foo', () => Promise.resolve())

        const err = await ensureSync(() => schema.validate('john')).should.be.rejected()

        expect(err.message).toMatch(/Validation test of type: "test"/)
      })
    })
  }

  describe('oneOf', () => {
    const inst = mixed().oneOf(['hello'])

    TestHelpers.validateAll(inst, {
      valid: [undefined, 'hello'],
      invalid: [
        'YOLO',
        [undefined, inst.required(), 'required'],
        [null, inst.nullable()],
        [null, inst.nullable().required(), 'required'],
      ],
    })
  })

  describe('should exclude values', () => {
    const inst = mixed().notOneOf([5, 'hello'])

    TestHelpers.validateAll(inst, {
      valid: [6, 'hfhfh', [5, inst.oneOf([5]), '`oneOf` called after'], null],
      invalid: [5, [null, inst.required(), 'required schema']],
    })

    it('should throw the correct error', async () => {
      const err = await inst.validate(5).should.be.rejected()

      err.errors[0].should.equal('this must not be one of the following values: 5, hello')
    })
  })

  it('should overload test()', () => {
    const inst = mixed().test('test', noop)

    inst.tests.length.should.equal(1)
    inst.tests[0].TEST.test.should.equal(noop)
    inst.tests[0].TEST.message.should.equal('${path} is invalid')
  })

  it('should allow non string messages', async () => {
    const message = { key: 'foo' }
    const inst = mixed().test('test', message, () => false)

    inst.tests.length.should.equal(1)
    inst.tests[0].TEST.message.should.equal(message)

    const error = await inst.validate('foo').should.be.rejected()

    error.message.should.equal(message)
  })

  it('should dedupe tests with the same test function', () => {
    const inst = mixed()
      .test('test', ' ', noop)
      .test('test', 'asdasd', noop)

    inst.tests.length.should.equal(1)
    inst.tests[0].TEST.message.should.equal('asdasd')
  })

  it('should not dedupe tests with the same test function and different type', () => {
    const inst = mixed()
      .test('test', ' ', noop)
      .test('test-two', 'asdasd', noop)

    inst.tests.length.should.equal(2)
  })

  it('should respect exclusive validation', () => {
    let inst = mixed()
      .test({
        message: 'invalid',
        exclusive: true,
        name: 'test',
        test: () => {},
      })
      .test({ message: 'also invalid', name: 'test', test: () => {} })

    inst.tests.length.should.equal(1)

    inst = mixed()
      .test({ message: 'invalid', name: 'test', test: () => {} })
      .test({ message: 'also invalid', name: 'test', test: () => {} })

    inst.tests.length.should.equal(2)
  })

  it('should non-exclusive tests should stack', () => {
    const inst = mixed()
      .test({ name: 'test', message: ' ', test: () => {} })
      .test({ name: 'test', message: ' ', test: () => {} })

    inst.tests.length.should.equal(2)
  })

  it('should replace existing tests, with exclusive test ', () => {
    const inst = mixed()
      .test({ name: 'test', message: ' ', test: noop })
      .test({ name: 'test', exclusive: true, message: ' ', test: noop })

    inst.tests.length.should.equal(1)
  })

  it('should replace existing exclusive tests, with non-exclusive', () => {
    const inst = mixed()
      .test({ name: 'test', exclusive: true, message: ' ', test: () => {} })
      .test({ name: 'test', message: ' ', test: () => {} })
      .test({ name: 'test', message: ' ', test: () => {} })

    inst.tests.length.should.equal(2)
  })

  it('exclusive tests should throw without a name', () => {
    ;(() => {
      mixed().test({ message: 'invalid', exclusive: true, test: noop })
    }).should.throw()
  })

  it('exclusive tests should replace previous ones', async () => {
    const inst = mixed().test({
      message: 'invalid',
      exclusive: true,
      name: 'max',
      test: v => v < 5,
    })
    ;(await inst.isValid(8)).should.equal(false)
    ;(await inst
      .test({
        message: 'invalid',
        exclusive: true,
        name: 'max',
        test: v => v < 10,
      })
      .isValid(8)).should.equal(true)
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
          this.path.should.equal('test')
          this.parent.should.eql({ other: 5, test: 'hi' })
          this.options.context.should.eql({ user: 'jason' })
          called = true
          return true
        },
      }),
    })

    await inst.validate({ other: 5, test: 'hi' }, { context: { user: 'jason' } })

    called.should.equal(true)
  })

  it('tests can return an error', () => {
    const inst = mixed().test({
      message: 'invalid ${path}',
      name: 'max',
      test() {
        return this.createError({ path: 'my.path' })
      },
    })

    return inst
      .validate('')
      .should.be.rejected()
      .then(function(e) {
        e.path.should.equal('my.path')
        e.errors[0].should.equal('invalid my.path')
      })
  })

  it('should use returned error path and message', () => {
    const inst = mixed().test({
      message: 'invalid ${path}',
      name: 'max',
      test() {
        return this.createError({ message: '${path} nope!', path: 'my.path' })
      },
    })

    return inst
      .validate({ other: 5, test: 'hi' })
      .should.be.rejected()
      .then(function(e) {
        e.path.should.equal('my.path')
        e.errors[0].should.equal('my.path nope!')
      })
  })

  describe('concat', () => {
    let next
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
      reach(next, 'str').tests.length.should.equal(3) // presence, alt presence, and trim
    })

    it('should have the tests in the correct order', () => {
      reach(next, 'str').tests[0].TEST_OPTIONS.name.should.equal('required')
    })

    it('should validate correctly', async () => {
      await inst.isValid({ str: 'hi', str2: 'hi', obj: {} }).should.become(true)
      ;(await next
        .validate({ str: ' hi  ', str2: 'hi', obj: { str: 'hi' } })
        .should.be.fulfilled()).should.deep.eql({
        str: 'hi',
        str2: 'hi',
        obj: { str: 'hi' },
      })
    })

    it('should throw the correct validation errors', async () => {
      let result = await next.validate({ str: 'hi', str2: 'hi', obj: {} }).should.be.rejected()

      result.message.should.contain('obj.str is a required field')

      result = await next.validate({ str2: 'hi', obj: { str: 'hi' } }).should.be.rejected()

      result.message.should.contain('str is a required field')
    })
  })

  it('concat should allow mixed and other type', function() {
    const inst = mixed().default('hi')
    ;(function() {
      inst.concat(string())._type.should.equal('string')
    }.should.not.throw(TypeError))
  })

  it('should handle conditionals', async function() {
    let inst = mixed().when('prop', {
      is: 5,
      then: mixed().required('from parent'),
    })

    await inst.validate(undefined, { parent: { prop: 5 } }).should.be.rejected()
    await inst.validate(undefined, { parent: { prop: 1 } }).should.be.fulfilled()
    await inst.validate('hello', { parent: { prop: 5 } }).should.be.fulfilled()

    inst = string().when('prop', {
      is(val) {
        return val === 5
      },
      then: string().required(),
      otherwise: string().min(4),
    })

    await inst.validate(undefined, { parent: { prop: 5 } }).should.be.rejected()
    await inst.validate('hello', { parent: { prop: 1 } }).should.be.fulfilled()
    await inst.validate('hel', { parent: { prop: 1 } }).should.be.rejected()
  })

  it('should handle multiple conditionals', function() {
    let called = false
    let inst = mixed().when(['prop', 'other'], function(prop, other) {
      other.should.equal(true)
      prop.should.equal(1)
      called = true
    })

    inst.cast({}, { context: { prop: 1, other: true } })
    called.should.equal(true)

    inst = mixed().when(['prop', 'other'], {
      is: 5,
      then: mixed().required(),
    })

    return inst
      .isValid(undefined, { context: { prop: 5, other: 5 } })
      .should.eventually()
      .equal(false)
  })

  it('should require context when needed', async function() {
    let inst = mixed().when('$prop', {
      is: 5,
      then: mixed().required('from context'),
    })

    await inst.validate(undefined, { context: { prop: 5 } }).should.be.rejected()
    await inst.validate(undefined, { context: { prop: 1 } }).should.be.fulfilled()
    await inst.validate('hello', { context: { prop: 5 } }).should.be.fulfilled()

    inst = string().when('$prop', {
      is(val) {
        return val === 5
      },
      then: string().required(),
      otherwise: string().min(4),
    })

    await inst.validate(undefined, { context: { prop: 5 } }).should.be.rejected()
    await inst.validate('hello', { context: { prop: 1 } }).should.be.fulfilled()
    await inst.validate('hel', { context: { prop: 1 } }).should.be.rejected()
  })

  it('should not use context refs in object calculations', function() {
    const inst = object({
      prop: string().when('$prop', {
        is: 5,
        then: string().required('from context'),
      }),
    })

    inst.default().should.eql({ prop: undefined })
  })

  it('should use label in error message', async function() {
    const label = 'Label'
    const inst = object({
      prop: string()
        .required()
        .label(label),
    })

    await inst
      .validate({})
      .should.be.rejected()
      .then(function(err) {
        err.message.should.equal(`${label} is a required field`)
      })
  })

  it('should add meta() data', () => {
    string()
      .meta({ input: 'foo' })
      .meta({ foo: 'bar' })
      .meta()
      .should.eql({
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

    desc.should.eql({
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
