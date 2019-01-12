import {
  array,
  boolean,
  date,
  lazy,
  mixed,
  number,
  object,
  ObjectSchema,
  reach,
  ref,
  string,
  StringSchema,
} from 'yup'
import { genIsInvalid, genIsValid } from './helpers'

describe('Object types', () => {
  describe('min', () => {
    genIsInvalid(
      object({
        len: number(),
        name: string().min(ref('len')),
      }),
      [{ len: 10, name: 'john' }],
    )
  })

  describe('max', () => {
    genIsInvalid(
      object({
        len: number(),
        name: string().max(ref('len')),
      }),
      [{ len: 3, name: 'john' }],
    )
  })

  it('length', () => {
    genIsInvalid(
      object({
        len: number(),
        name: string().length(ref('len')),
      }),
      [{ len: 5, name: 'foo' }],
    )
  })

  describe('casting', () => {
    let inst: ObjectSchema<any>

    beforeEach(() => {
      inst = object({
        arr: array().of(number()),
        arrNested: array().of(object().shape({ num: number() })),
        dte: date(),
        nested: object().shape({ str: string() }),
        num: number(),
        str: string(),
        stripped: string().strip(),
      })
    })

    it('should parse json strings', () => {
      object({ hello: number() })
        .cast('{ "hello": "5" }')
        .should.eql({
          hello: 5,
        })
    })

    it('should return null for failed casts', () => {
      expect(object().cast('dfhdfh', { assert: false })).toBeNull()
    })

    it('should recursively cast fields', () => {
      const obj = {
        arr: ['4', 5],
        arrNested: [{ num: 5 }, { num: '5' }],
        dte: '2014-09-23T19:25:25Z',
        nested: { str: 5 },
        num: '5',
        str: 'hello',
      }

      const casted = inst.cast(obj)

      casted.should.eql({
        arr: [4, 5],
        arrNested: [{ num: 5 }, { num: 5 }],
        dte: new Date(1411500325000),
        nested: { str: '5' },
        num: 5,
        str: 'hello',
      })

      expect(casted.arrNested[0]).toStrictEqual(obj.arrNested[0]) // 'should be kept as is'
    })

    it('should return the same object if all props are already cast', () => {
      const obj = {
        arr: [4, 5],
        arrNested: [{ num: 5 }, { num: 5 }],
        dte: new Date(1411500325000),
        nested: { str: '5' },
        num: 5,
        str: 'hello',
      }

      expect(inst.cast(obj)).toStrictEqual(obj)
    })
  })

  describe('oneOf', () => {
    it('should work with refs', async () => {
      const inst = object({
        bar: string().oneOf([ref('foo'), 'b']),
        foo: string(),
      })

      expect.assertions(2)
      await expect(inst.validate({ foo: 'a', bar: 'a' })).resolves
      await expect(inst.validate({ foo: 'foo', bar: 'bar' })).resolves
    })
  })
  describe('validation', () => {
    let inst: ObjectSchema
    let obj: any

    beforeEach(() => {
      inst = object().shape({
        arr: array().of(number().max(6)),
        arrNested: array().of(object().shape({ num: number() })),
        dte: date(),
        nested: object()
          .shape({ str: string().min(3) })
          .required(),
        num: number().max(4),
        str: string(),
      })
      obj = {
        arr: ['4', 5, 6],
        arrNested: [{ num: 5 }, { num: '2' }],
        dte: '2014-09-23T19:25:25Z',
        nested: { str: 5 },
        num: '4',
        str: 'hello',
      }
    })

    it('should run validations recursively', async () => {
      expect.assertions(1)
      await expect(inst.isValid(null)).resolves.toStrictEqual(true)

      await expect(inst.validate(obj)).rejects.toMatchObject({
        errors: [{ message: 'nested.str' }],
      })

      obj.nested.str = 'hello'
      obj.arr[1] = 8

      await expect(inst.validate(obj)).rejects.toMatchObject({
        errors: [{ message: 'arr[1]' }],
      })
    })

    it('should prevent recursive casting', async () => {
      const castSpy = sinon.spy(StringSchema.prototype, '_cast')

      inst = object({
        field: string(),
      })

      const value = await inst.validate({ field: 5 })

      expect(value.field).toStrictEqual('5')

      castSpy.should.have.been.calledOnce()

      StringSchema.prototype._cast.restore()
    })

    it('should respect strict for nested values', async () => {
      inst = object({
        field: string(),
      }).strict()

      const err = await inst.validate({ field: 5 }).should.be.rejected()

      err.message.should.match(/must be a `string` type/)
    })

    it('should respect child schema with strict()', async () => {
      inst = object({
        field: number().strict(),
      })

      let err = await inst.validate({ field: '5' }).should.be.rejected()

      err.message.should.match(/must be a `number` type/)

      inst.cast({ field: '5' }).should.eql({ field: 5 })

      err = await object({
        port: number()
          .strict()
          .integer(),
      })
        .validate({ port: 'asdad' })
        .should.be.rejected()
    })

    it('should handle custom validation', async () => {
      const inst = object()
        .shape({
          prop: mixed(),
          other: mixed(),
        })
        .test('test', '${path} oops', () => false)

      const err = await inst.validate({}).should.be.rejected()

      expect(err.errors[0]).toStrictEqual('this oops')
    })

    it('should not clone during validating', async function() {
      const base = mixed.prototype.clone

      mixed.prototype.clone = function(...args) {
        if (!this._mutate) {
          throw new Error('should not call clone')
        }

        return base.apply(this, args)
      }

      try {
        await inst.validate({
          nested: { str: 'jimmm' },
          arrNested: [{ num: 5 }, { num: '2' }],
        })
        await inst.validate({
          nested: { str: 5 },
          arrNested: [{ num: 5 }, { num: '2' }],
        })
      } catch (err) {
        /* ignore */
      } finally {
        mixed.prototype.clone = base
      }
    })
  })

  it('should pass options to children', function() {
    object({
      names: object({
        first: string(),
      }),
    })
      .cast(
        {
          extra: true,
          names: { first: 'john', extra: true },
        },
        { stripUnknown: true },
      )
      .should.eql({
        names: {
          first: 'john',
        },
      })
  })

  it('should call shape with constructed with an arg', () => {
    const inst = object({
      prop: mixed(),
    })

    expect(inst.fields.prop).not.toBeNull()
  })

  describe('object defaults', () => {
    let objSchema

    beforeEach(() => {
      objSchema = object({
        nest: object({
          str: string().default('hi'),
        }),
      })
    })

    it('should expand objects by default', () => {
      objSchema.default().should.eql({
        nest: { str: 'hi' },
      })
    })

    it('should accept a user provided default', () => {
      objSchema = objSchema.default({ boom: 'hi' })

      objSchema.default().should.eql({
        boom: 'hi',
      })
    })

    it('should add empty keys when sub schema has no default', () => {
      object({
        str: string(),
        nest: object({ str: string() }),
      })
        .default()
        .should.eql({
          nest: { str: undefined },
          str: undefined,
        })
    })

    it('should create defaults for missing object fields', () => {
      object({
        prop: mixed(),
        other: object({
          x: object({ b: string() }),
        }),
      })
        .cast({ prop: 'foo' })
        .should.eql({
          prop: 'foo',
          other: { x: { b: undefined } },
        })
    })
  })

  it('should handle empty keys', () => {
    const inst = object().shape({
      prop: mixed(),
    })

    return Promise.all([
      inst
        .isValid({})
        .should.eventually()
        .equal(true),

      inst
        .shape({ prop: mixed().required() })
        .isValid({})
        .should.eventually()
        .equal(false),
    ])
  })

  it('should work with noUnknown', () => {
    const inst = object().shape({
      prop: mixed(),
      other: mixed(),
    })

    return Promise.all([
      inst
        .noUnknown('hi')
        .validate({ extra: 'field' }, { strict: true })
        .should.be.rejected()
        .then(err => {
          expect(err.errors[0]).toStrictEqual('hi')
        }),

      inst
        .noUnknown()
        .validate({ extra: 'field' }, { strict: true })
        .should.be.rejected()
        .then(err => {
          err.errors[0].should.be.a('string')
        }),
    ])
  })

  it('should strip specific fields', () => {
    const inst = object().shape({
      prop: mixed().strip(false),
      other: mixed().strip(),
    })

    inst.cast({ other: 'boo', prop: 'bar' }).should.eql({
      prop: 'bar',
    })
  })

  it('should handle field striping with `when`', () => {
    const inst = object().shape({
      other: boolean(),
      prop: mixed().when('other', {
        is: true,
        then: s => s.strip(),
      }),
    })

    inst.cast({ other: true, prop: 'bar' }).should.eql({
      other: true,
    })
  })

  it('should allow refs', async function() {
    const schema = object({
      quz: ref('baz'),
      baz: ref('foo.bar'),
      foo: object({
        bar: string(),
      }),
      x: ref('$x'),
    })

    const value = await schema.validate(
      {
        foo: { bar: 'boom' },
      },
      { context: { x: 5 } },
    )

    // console.log(value)
    value.should.eql({
      foo: {
        bar: 'boom',
      },
      baz: 'boom',
      quz: 'boom',
      x: 5,
    })
  })

  it('should allow refs with abortEarly false', async () => {
    const schema = object().shape({
      field: string(),
      dupField: ref('field'),
    })

    const actual = await schema
      .validate(
        {
          field: 'test',
        },
        { abortEarly: false },
      )
      .should.not.be.rejected()

    actual.should.eql({ field: 'test', dupField: 'test' })
  })

  describe('lazy evaluation', () => {
    const types = {
      string: string(),
      number: number(),
    }

    it('should be cast-able', () => {
      const inst = lazy(() => number())

      inst.cast.should.be.a('function')
      expect(inst.cast('4')).toStrictEqual(4)
    })

    it('should be validatable', async () => {
      const inst = lazy(() =>
        string()
          .trim('trim me!')
          .strict(),
      )

      inst.validate.should.be.a('function')

      try {
        await inst.validate('  john  ')
      } catch (err) {
        expect(err.message).toStrictEqual('trim me!')
      }
    })

    it('should resolve to schema', () => {
      const inst = object({
        nested: lazy(() => inst),
        x: object({
          y: lazy(() => inst),
        }),
      })

      expect(reach(inst, 'nested')).toStrictEqual(inst)
      expect(reach(inst, 'x.y')).toStrictEqual(inst)
    })

    it('should be passed the value', done => {
      const inst = object({
        nested: lazy(value => {
          expect(value).toStrictEqual('foo')
          done()
          return string()
        }),
      })

      inst.cast({ nested: 'foo' })
    })

    it('should be passed the options', done => {
      const opts = {}
      const inst = lazy((_, options) => {
        expect(options).toStrictEqual(opts)
        done()
        return string()
      })

      inst.cast({ nested: 'foo' }, opts)
    })

    it('should always return a schema', () => {
      (() => lazy(() => {}).cast()).should.throw(/must return a valid schema/)
    })

    it('should set the correct path', async () => {
      const inst = object({
        str: string()
          .required()
          .nullable(),
        nested: lazy(() => inst.default(undefined)),
      })

      const value = {
        nested: { str: null },
        str: 'foo',
      }

      try {
        await inst.validate(value, { strict: true })
      } catch (err) {
        expect(err.path).toStrictEqual('nested.str')
        err.message.should.match(/required/)
      }
    })

    it('should resolve array sub types', async () => {
      const inst = object({
        str: string()
          .required()
          .nullable(),
        nested: array().of(lazy(() => inst.default(undefined))),
      })

      const value = {
        nested: [{ str: null }],
        str: 'foo',
      }

      try {
        await inst.validate(value, { strict: true })
      } catch (err) {
        expect(err.path).toStrictEqual('nested[0].str')
        err.message.should.match(/required/)
      }
    })

    it('should resolve for each array item', async () => {
      const inst = array().of(lazy(value => types[typeof value]))

      const val = await inst.validate(['john', 4], { strict: true })

      val.should.eql(['john', 4])
    })
  })

  it('should respect abortEarly', () => {
    const inst = object({
      nest: object({
        str: string().required(),
      }).test('name', 'oops', () => false),
    })

    return Promise.all([
      inst
        .validate({ nest: { str: '' } })
        .should.be.rejected()
        .then(err => {
          err.value.should.eql({ nest: { str: '' } })
          expect(err.errors.length).toStrictEqual(1)
          err.errors.should.eql(['oops'])

          expect(err.path).toStrictEqual('nest')
        }),

      inst
        .validate({ nest: { str: '' } }, { abortEarly: false })
        .should.be.rejected()
        .then(err => {
          err.value.should.eql({ nest: { str: '' } })
          expect(err.errors.length).toStrictEqual(2)
          err.errors.should.eql(['nest.str is a required field', 'oops'])
        }),
    ])
  })

  it('should sort errors by insertion order', async () => {
    const inst = object({
      // use `when` to make sure it is validated second
      foo: string().when('bar', () => string().min(5)),
      bar: string().required(),
    })

    const err = await inst.validate({ foo: 'foo' }, { abortEarly: false }).should.rejected()

    err.errors.should.eql(['foo must be at least 5 characters', 'bar is a required field'])
  })

  it('should respect recursive', () => {
    const inst = object({
      nest: object({
        str: string().required(),
      }),
    }).test('name', 'oops', () => false)

    const val = { nest: { str: null } }

    return Promise.all([
      inst
        .validate(val, { abortEarly: false })
        .should.be.rejected()
        .then(err => {
          expect(err.errors.length).toStrictEqual(2)
        }),

      inst
        .validate(val, { abortEarly: false, recursive: false })
        .should.be.rejected()
        .then(err => {
          expect(err.errors.length).toStrictEqual(1)
          err.errors.should.eql(['oops'])
        }),
    ])
  })

  it('should alias or move keys', () => {
    const inst = object()
      .shape({
        myProp: mixed(),
        Other: mixed(),
      })
      .from('prop', 'myProp')
      .from('other', 'Other', true)

    inst.cast({ prop: 5, other: 6 }).should.eql({ myProp: 5, other: 6, Other: 6 })
  })

  it('should alias nested keys', () => {
    const inst = object({
      foo: object({
        bar: string(),
      }),
    }).from('foo.bar', 'foobar', true)

    inst.cast({ foo: { bar: 'quz' } }).should.eql({ foobar: 'quz', foo: { bar: 'quz' } })
  })

  it('should not move keys when it does not exist', () => {
    const inst = object()
      .shape({
        myProp: mixed(),
      })
      .from('prop', 'myProp')

    inst.cast({ myProp: 5 }).should.eql({ myProp: 5 })

    inst.cast({ myProp: 5, prop: 7 }).should.eql({ myProp: 7 })
  })

  it('should handle conditionals', () => {
    const inst = object().shape({
      noteDate: number()
        .when('stats.isBig', { is: true, then: number().min(5) })
        .when('other', function(v) {
          if (v === 4) {
            return this.max(6)
          }
        }),
      stats: object({ isBig: boolean() }),
      other: number()
        .min(1)
        .when('stats', { is: 5, then: number() }),
    })

    return Promise.all([
      inst
        .isValid({ stats: { isBig: true }, rand: 5, noteDate: 7, other: 4 })
        .should.eventually()
        .equal(false),
      inst
        .isValid({ stats: { isBig: true }, noteDate: 1, other: 4 })
        .should.eventually()
        .equal(false),

      inst
        .isValid({ stats: { isBig: true }, noteDate: 7, other: 6 })
        .should.eventually()
        .equal(true),
      inst
        .isValid({ stats: { isBig: true }, noteDate: 7, other: 4 })
        .should.eventually()
        .equal(false),

      inst
        .isValid({ stats: { isBig: false }, noteDate: 4, other: 4 })
        .should.eventually()
        .equal(true),

      inst
        .isValid({ stats: { isBig: true }, noteDate: 1, other: 4 })
        .should.eventually()
        .equal(false),
      inst
        .isValid({ stats: { isBig: true }, noteDate: 6, other: 4 })
        .should.eventually()
        .equal(true),
    ])
  })

  it('should allow opt out of topo sort on specific edges', () => {
    (function() {
      object().shape({
        orgID: number().when('location', function(v) {
          if (v == null) {
            return this.required()
          }
        }),
        location: string().when('orgID', function(v) {
          if (v == null) {
            return this.required()
          }
        }),
      })
    }.should.throw('Cyclic dependency, node was:"location"'))
    ; (function() {
      object().shape(
        {
          orgID: number().when('location', function(v) {
            if (v == null) {
              return this.required()
            }
          }),
          location: string().when('orgID', function(v) {
            if (v == null) {
              return this.required()
            }
          }),
        },
        [['location', 'orgID']],
      )
    }.should.not.throw())
  })

  it('should use correct default when concating', () => {
    const inst = object({
      other: boolean(),
    }).default(undefined)

    expect(inst.concat(object()).default()).toBeUndefined()

    expect(inst.concat(object().default({})).default()).toStrictEqual({})
  })

  it('should handle nested conditionals', () => {
    const countSchema = number().when('isBig', {
      is: true,
      then: number().min(5),
    })
    const inst = object({
      other: boolean(),
      stats: object({
        isBig: boolean(),
        count: countSchema,
      })
        .default(undefined)
        .when('other', { is: true, then: object().required() }),
    })

    return Promise.all([
      inst
        .validate({ stats: undefined, other: true })
        .should.be.rejected()
        .then(err => {
          err.errors[0].should.contain('required')
        }),

      inst
        .validate({ stats: { isBig: true, count: 3 }, other: true })
        .should.be.rejected()
        .then(err => {
          err.errors[0].should.contain('must be greater than or equal to 5')
        }),

      inst
        .validate({ stats: { isBig: true, count: 10 }, other: true })
        .should.be.fulfilled()
        .then(value => {
          value.should.deep.equal({
            stats: { isBig: true, count: 10 },
            other: true,
          })
        }),

      countSchema
        .validate(10, { context: { isBig: true } })
        .should.be.fulfilled()
        .then(value => {
          value.should.deep.equal(10)
        }),
    ])
  })

  it('should camelCase keys', () => {
    const inst = object()
      .shape({
        conStat: number(),
        caseStatus: number(),
        hiJohn: number(),
      })
      .camelCase()

    inst
      .cast({ CON_STAT: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ conStat: 5, caseStatus: 6, hiJohn: 4 })

    expect(inst.nullable().cast(null)).toBeNull()
  })

  // it('should camelCase with leading underscore', () => {
  //   let inst = object().camelCase()
  //
  //   inst
  //     .cast({ CON_STAT: 5, __isNew: true, __IS_FUN: true })
  //     .should
  //     .eql({ conStat: 5, __isNew: true, __isFun: true })
  // })

  it('should CONSTANT_CASE keys', () => {
    const inst = object()
      .shape({
        CON_STAT: number(),
        CASE_STATUS: number(),
        HI_JOHN: number(),
      })
      .constantCase()

    inst
      .cast({ conStat: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ CON_STAT: 5, CASE_STATUS: 6, HI_JOHN: 4 })

    expect(inst.nullable().cast(null)).toBeNull()
  })

  xit('should handle invalid shapes better', async () => {
    const schema = object().shape({
      permissions: undefined,
    })

    expect(await schema.isValid({ permissions: [] }, { abortEarly: false })).toStrictEqual(true)
  })
})
