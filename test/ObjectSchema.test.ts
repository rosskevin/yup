import * as sinon from 'sinon'
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
      object().shape({
        len: number(),
        name: string().min(ref('len')),
      }),
      [{ len: 10, name: 'john' }],
    )
  })

  describe('max', () => {
    genIsInvalid(
      object().shape({
        len: number(),
        name: string().max(ref('len')),
      }),
      [{ len: 3, name: 'john' }],
    )
  })

  it('length', () => {
    genIsInvalid(
      object().shape({
        len: number(),
        name: string().length(ref('len')),
      }),
      [{ len: 5, name: 'foo' }],
    )
  })

  describe('cast', () => {
    // let inst: ObjectSchema<any>

    // beforeEach(() => {
    //   inst = object().shape({
    //     arr: array().of(number()),
    //     arrNested: array().of(object().shape({ num: number() })),
    //     dte: date(),
    //     nested: object().shape({ str: string() }),
    //     num: number(),
    //     str: string(),
    //     stripped: string().strip(),
    //   })
    // })

    it('should parse json strings', () => {
      object()
        .shape({ hello: number() })
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

      const inst = object().shape({
        arr: array().of(number()),
        arrNested: array().of(object().shape({ num: number() })),
        dte: date(),
        nested: object().shape({ str: string() }),
        num: number(),
        str: string(),
        stripped: string().strip(),
      })
      const casted = inst.cast(obj) as any

      expect(casted).toMatchObject({
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
      const inst = object().shape({
        arr: array().of(number()),
        arrNested: array().of(object().shape({ num: number() })),
        dte: date(),
        nested: object().shape({ str: string() }),
        num: number(),
        str: string(),
        stripped: string().strip(),
      })
      expect(inst.cast(obj)).toStrictEqual(obj)
    })

    it('with stripUnknown', () => {
      expect(
        object()
          .shape({
            names: object().shape({
              first: string(),
            }),
          })
          .cast(
            {
              extra: true,
              names: { first: 'john', extra: true },
            },
            { stripUnknown: true },
          ),
      ).toMatchObject({
        names: {
          first: 'john',
        },
      })
    })

    it('should alias or move keys', () => {
      const inst = object()
        .shape({
          Other: mixed(),
          myProp: mixed(),
        })
        .from('prop', 'myProp')
        .from('other', 'Other', true)

      expect(inst.cast({ prop: 5, other: 6 })).toMatchObject({ myProp: 5, other: 6, Other: 6 })
    })

    it('should alias nested keys', () => {
      const inst = object()
        .shape({
          foo: object().shape({
            bar: string(),
          }),
        })
        .from('foo.bar', 'foobar', true)

      expect(inst.cast({ foo: { bar: 'quz' } })).toMatchObject({
        foo: { bar: 'quz' },
        foobar: 'quz',
      })
    })

    it('should not move keys when it does not exist', () => {
      const inst = object()
        .shape({
          myProp: mixed(),
        })
        .from('prop', 'myProp')

      expect(inst.cast({ myProp: 5 })).toMatchObject({ myProp: 5 })
      expect(inst.cast({ myProp: 5, prop: 7 })).toMatchObject({ myProp: 7 })
    })
  })

  describe('oneOf', () => {
    it('should work with refs', async () => {
      const inst = object().shape({
        bar: string().oneOf([ref('foo'), 'b']),
        foo: string(),
      })

      expect.assertions(2)
      await expect(inst.validate({ foo: 'a', bar: 'a' })).resolves
      await expect(inst.validate({ foo: 'foo', bar: 'bar' })).resolves
    })
  })

  describe('strict', () => {
    it('should respect strict for nested values', async () => {
      expect.assertions(1)
      await expect(
        object()
          .shape({
            field: string(),
          })
          .strict()
          .validate({ field: 5 }),
      ).rejects.toThrow(/must be a `string` type/)
    })

    it('should respect child schema with strict()', async () => {
      const inst = object().shape({
        field: number()
          .strict()
          .integer(),
      })

      // assert cast works as expected
      expect(inst.cast({ field: '5' })).toMatchObject({ field: 5 })

      // strict mode will not cast
      expect.assertions(3)
      await expect(inst.validate({ field: 5 })).resolves.toStrictEqual(true)
      await expect(inst.validate({ field: '5' })).rejects.toThrow(/must be a `number` type/)
      await expect(inst.validate({ field: 'asdad' })).rejects
    })
  })

  describe('validation', () => {
    it('should run validations recursively', async () => {
      const inst = object().shape({
        arr: array().of(number().max(6)),
        arrNested: array().of(object().shape({ num: number() })),
        dte: date(),
        nested: object()
          .shape({ str: string().min(3) })
          .required(),
        num: number().max(4),
        str: string(),
      })
      const obj = {
        arr: ['4', 5, 6],
        arrNested: [{ num: 5 }, { num: '2' }],
        dte: '2014-09-23T19:25:25Z',
        nested: { str: 5 },
        num: '4',
        str: 'hello',
      }

      expect.assertions(3)
      await expect(inst.isValid(null)).resolves.toStrictEqual(true)
      await expect(inst.validate(obj)).rejects.toMatchObject({
        errors: [{ message: 'nested.str' }],
      })

      obj.nested.str = 'hello' as any
      obj.arr[1] = 8

      await expect(inst.validate(obj)).rejects.toMatchObject({
        errors: [{ message: 'arr[1]' }],
      })
    })

    it('should prevent recursive casting', async () => {
      const castSpy = sinon.spy(StringSchema.prototype, '_cast')
      const inst = object().shape({
        field: string(),
      })

      expect.assertions(1)
      const value = await inst.validate({ field: 5 })

      expect((value as { field: string }).field).toStrictEqual('5')
      expect(castSpy.calledOnce).toStrictEqual(true)
      // tslint:disable-next-line
      ;(StringSchema.prototype._cast as any).restore()
    })

    it('should handle custom validation', async () => {
      const inst = object()
        .shape({
          other: mixed(),
          prop: mixed(),
        })
        .test({ name: 'test', message: '${path} oops', test: () => false })

      expect.assertions(1)
      await expect(inst.validate({})).rejects.toThrow(/this oops/)
    })

    it('should not clone during validating', async () => {
      class NoCloneDuringValidate extends ObjectSchema {
        public clone() {
          if (!this._mutate) {
            throw new Error('should not call clone')
          }
          return super.clone()
        }
      }

      const inst = new NoCloneDuringValidate().shape({
        arrNested: array().of(object().shape({ num: number() })),
        nested: object()
          .shape({ str: string().min(3) })
          .required(),
      })
      expect.assertions(2)
      await expect(
        inst.validate({
          arrNested: [{ num: 5 }, { num: '2' }],
          nested: { str: 'jimmm' },
        }),
      ).resolves
      await expect(
        inst.validate({
          arrNested: [{ num: 5 }, { num: '2' }],
          nested: { str: 5 },
        }),
      ).resolves
    })
  })

  it('should call shape with constructed with an arg', () => {
    const inst = object().shape({
      prop: mixed(),
    })

    expect(inst.fields.prop).not.toBeNull()
  })

  describe('default/defaultValue', () => {
    it('should use correct default when concating', () => {
      const inst = object()
        .shape({
          other: boolean(),
        })
        .default(undefined)

      expect(inst.concat(object()).defaultValue()).toBeUndefined()
      expect(inst.concat(object().default({})).defaultValue()).toMatchObject({})
    })

    it('should expand objects by default', () => {
      expect(
        object()
          .shape({
            nest: object().shape({
              str: string().default('hi'),
            }),
          })
          .defaultValue(),
      ).toMatchObject({
        nest: { str: 'hi' },
      })
    })

    it('should accept a user provided default', () => {
      expect(
        object()
          .shape({
            nest: object().shape({
              str: string().default('hi'),
            }),
          })
          .default({ boom: 'hi' })
          .defaultValue(),
      ).toMatchObject({
        boom: 'hi',
      })
    })

    it('should add empty keys when sub schema has no default', () => {
      expect(
        object()
          .shape({
            nest: object().shape({ str: string() }),
            str: string(),
          })
          .defaultValue(),
      ).toMatchObject({
        nest: { str: undefined },
        str: undefined,
      })
    })

    it('should create defaults for missing object fields', () => {
      expect(
        object()
          .shape({
            other: object().shape({
              x: object().shape({ b: string() }),
            }),
            prop: mixed(),
          })
          .cast({ prop: 'foo' }),
      ).toMatchObject({
        other: { x: { b: undefined } },
        prop: 'foo',
      })
    })
  })

  describe('should handle empty keys', () => {
    const inst = object().shape({
      prop: mixed(),
    })
    genIsValid(inst, [{}])
    genIsInvalid(inst.shape({ prop: mixed().required() }), [])
  })

  describe('noUnknown', () => {
    it('should work', async () => {
      const inst = object().shape({
        other: mixed(),
        prop: mixed(),
      })

      expect.assertions(1)
      await expect(
        inst.noUnknown(true, 'hi').validate({ extra: 'field' }, { strict: true }),
      ).rejects.toMatchObject({ errors: ['hi'] })
    })
  })
  it('should strip specific fields', () => {
    expect(
      object()
        .shape({
          other: mixed().strip(),
          prop: mixed().strip(false),
        })
        .cast({ other: 'boo', prop: 'bar' }),
    ).toMatchObject({
      prop: 'bar',
    })
  })

  it('should handle field striping with `when`', () => {
    const inst = object().shape({
      other: boolean(),
      prop: mixed().when('other', {
        is: true,
        then: (values, s) => s.strip(),
      }),
    })

    inst.cast({ other: true, prop: 'bar' }).should.eql({
      other: true,
    })
  })

  describe('refs', () => {
    it('should allow refs', async () => {
      const schema = object().shape({
        baz: ref('foo.bar'),
        foo: object().shape({
          bar: string(),
        }),
        quz: ref('baz'),
        x: ref('$x'),
      })

      expect.assertions(1)
      await expect(
        schema.validate(
          {
            foo: { bar: 'boom' },
          },
          { context: { x: 5 } },
        ),
      ).resolves.toMatchObject({
        baz: 'boom',
        foo: {
          bar: 'boom',
        },
        quz: 'boom',
        x: 5,
      })
    })

    it('should allow refs with abortEarly false', async () => {
      const schema = object().shape({
        dupField: ref('field'),
        field: string(),
      })

      expect.assertions(1)
      await expect(
        schema.validate(
          {
            field: 'test',
          },
          { abortEarly: false },
        ),
      ).resolves.toMatchObject({ field: 'test', dupField: 'test' })
    })
  })

  describe('lazy evaluation', () => {
    const types = {
      number: number(),
      string: string(),
    }

    it('should be cast-able', () => {
      const inst = lazy(() => number())
      expect(inst.cast('4')).toStrictEqual(4)
    })

    it('should be validatable', async () => {
      const inst = lazy(() =>
        string()
          .trim('trim me!')
          .strict(),
      )
      await expect(inst.validate('  john  ')).rejects.toThrow(/trim me!/)
    })

    it('should resolve to schema', () => {
      const inst = object().shape({
        nested: lazy(() => inst),
        x: object().shape({
          y: lazy(() => inst),
        }),
      })

      expect(reach(inst, 'nested')).toStrictEqual(inst)
      expect(reach(inst, 'x.y')).toStrictEqual(inst)
    })

    it('should be passed the value', done => {
      const inst = object().shape({
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

    it('should always return a schema', async () => {
      const inst = lazy(() => ({} as any))
      await expect(inst.cast('foo')).rejects.toThrow(/must return a valid schema/)
    })

    it('should set the correct path', async () => {
      const inst = object().shape({
        nested: lazy(() => inst.default(undefined)),
        str: string()
          .required()
          .nullable(),
      })

      const value = {
        nested: { str: null },
        str: 'foo',
      }

      expect.assertions(1)
      await expect(inst.validate(value, { strict: true })).rejects.toMatchObject({
        message: 'required',
        path: 'nested.str',
      })
    })

    it('should resolve array sub types', async () => {
      const inst = object().shape({
        nested: array().of(lazy(() => inst.default(undefined))),
        str: string()
          .required()
          .nullable(),
      })

      const value = {
        nested: [{ str: null }],
        str: 'foo',
      }

      expect.assertions(1)
      await expect(inst.validate(value, { strict: true })).toMatchObject({
        message: 'required',
        path: 'nested[0].str',
      })
    })

    it('should resolve for each array item', async () => {
      const inst = array().of(lazy(value => types[typeof value]))
      expect.assertions(1)
      await expect(inst.validate(['john', 4], { strict: true })).toStrictEqual(['john', 4])
    })
  })

  it('should respect abortEarly', async () => {
    const inst = object().shape({
      nest: object()
        .shape({
          str: string().required(),
        })
        .test({ name: 'name', message: 'oops', test: () => false }),
    })

    expect.assertions(2)
    await expect(inst.validate({ nest: { str: '' } })).rejects.toMatchObject({
      errors: ['oops'],
      path: 'nest',
      value: { nest: { str: '' } },
    })

    await expect(inst.validate({ nest: { str: '' } }, { abortEarly: false })).rejects.toMatchObject(
      {
        errors: ['nest.str is a required field', 'oops'],
        value: { nest: { str: '' } },
      },
    )
  })

  it('should sort errors by insertion order', async () => {
    const inst = object().shape({
      bar: string().required(),
      // use `when` to make sure it is validated second
      foo: string().when('bar', () => string().min(5)),
    })

    await expect(inst.validate({ foo: 'foo' }, { abortEarly: false })).rejects.toMatchObject({
      errors: ['foo must be at least 5 characters', 'bar is a required field'],
    })
  })

  it('should respect recursive', async () => {
    const inst = object()
      .shape({
        nest: object().shape({
          str: string().required(),
        }),
      })
      .test({ name: 'name', message: 'oops', test: () => false })

    const val = { nest: { str: null } }
    expect.assertions(2)
    await expect(inst.validate(val, { abortEarly: false })).rejects.toMatchObject({
      errors: ['FIXME', 'FIXME'],
    })

    await expect(inst.validate(val, { abortEarly: false, recursive: false })).rejects.toMatchObject(
      {
        errors: ['oops'],
      },
    )
  })

  it('should handle conditionals', () => {
    const inst = object().shape({
      noteDate: number()
        .when('stats.isBig', { is: true, then: number().min(5) })
        .when('other', (values, schema) => (values[0] === 4 ? schema.max(6) : undefined)),
      other: number()
        .min(1)
        .when('stats', { is: 5, then: number() }),
      stats: object().shape({ isBig: boolean() }),
    })

    genIsValid(inst, [
      { stats: { isBig: true }, noteDate: 7, other: 6 },
      { stats: { isBig: false }, noteDate: 4, other: 4 },
      { stats: { isBig: true }, noteDate: 6, other: 4 },
    ])
    genIsInvalid(inst, [
      { stats: { isBig: true }, rand: 5, noteDate: 7, other: 4 },
      { stats: { isBig: true }, noteDate: 1, other: 4 },
      { stats: { isBig: true }, noteDate: 7, other: 4 },
      { stats: { isBig: true }, noteDate: 1, other: 4 },
    ])
  })

  it('should allow opt out of topo sort on specific edges', async () => {
    await expect(
      object().shape({
        location: string().when('orgID', (v, schema) =>
          v == null ? schema.required() : undefined,
        ),
        orgID: number().when('location', (v, schema) =>
          v == null ? schema.required() : undefined,
        ),
      }),
    ).rejects.toThrow('Cyclic dependency, node was:"location"')
    await expect(
      object().shape(
        {
          location: string().when('orgID', (v, schema) =>
            v == null ? schema.required() : undefined,
          ),
          orgID: number().when('location', (v, schema) =>
            v == null ? schema.required() : undefined,
          ),
        },
        [['location', 'orgID']],
      ),
    ).resolves
  })

  it('should handle nested conditionals', async () => {
    const countSchema = number().when('isBig', {
      is: true,
      then: number().min(5),
    })
    const inst = object().shape({
      other: boolean(),
      stats: object()
        .shape({
          count: countSchema,
          isBig: boolean(),
        })
        .default(undefined)
        .when('other', { is: true, then: object().required() }),
    })

    expect.assertions(4)
    await expect(inst.validate({ stats: undefined, other: true })).rejects.toThrow(/required/)

    await expect(inst.validate({ stats: { isBig: true, count: 3 }, other: true })).rejects.toThrow(
      /must be greater than or equal to 5/,
    )

    await expect(
      inst.validate({ stats: { isBig: true, count: 10 }, other: true }),
    ).resolves.toMatchObject({
      other: true,
      stats: { isBig: true, count: 10 },
    })

    await expect(countSchema.validate(10, { context: { isBig: true } })).resolves.toStrictEqual(10)
  })

  it('should camelCase keys', () => {
    const inst = object()
      .shape({
        caseStatus: number(),
        conStat: number(),
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
        CASE_STATUS: number(),
        CON_STAT: number(),
        HI_JOHN: number(),
      })
      .constantCase()

    inst
      .cast({ conStat: 5, CaseStatus: 6, 'hi john': 4 })
      .should.eql({ CON_STAT: 5, CASE_STATUS: 6, HI_JOHN: 4 })

    expect(inst.nullable().cast(null)).toBeNull()
  })
})
