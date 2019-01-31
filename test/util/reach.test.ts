import { array, lazy, number, object, reach, string } from '../../src'

describe('reach', () => {
  it('should handle schemas', async () => {
    const num = number()
    const inst = object().shape({
      num: number().max(4),

      nested: object().shape({
        arr: array().of(object().shape({ num })),
      }),
    })

    expect(reach(inst, '')).toStrictEqual(inst)
    expect(reach(inst, 'nested.arr.num')).toStrictEqual(num)
    expect(reach(inst, 'nested.arr[].num')).toStrictEqual(num)
    expect(reach(inst, 'nested.arr[0].num')).toStrictEqual(num)
    expect(reach(inst, 'nested.arr[1].num')).toStrictEqual(num)
    expect(reach(inst, 'nested["arr"][1].num')).not.toStrictEqual(number())

    const valid = await reach(inst, 'nested.arr[].num').isValid(5)
    expect(valid).toStrictEqual(true)
  })

  it('should handle conditionals', () => {
    const num = number()
    const inst = object().shape({
      nested: object().shape({
        arr: array().when('$bar', (bar: any) => {
          return bar !== 3
            ? array().of(number())
            : array().of(
                object().shape({
                  foo: number(),
                  num: number().when('foo', (foo: any) => (foo === 5 ? num : undefined)),
                }),
              )
        }),
      }),
      num: number().max(4),
    })

    const value = {
      bar: 3,
      nested: {
        arr: [{ foo: 5 }, { foo: 3 }],
      },
    }

    expect(reach(inst, 'nested.arr[0].num', value)).toStrictEqual(num)
    expect(reach(inst, 'nested.arr[].num', value)).toStrictEqual(num)
    expect(reach(inst, 'nested.arr.num', value)).toStrictEqual(num)

    const context = { bar: 3 }
    expect(reach(inst, 'nested.arr[0].num', value, context)).toStrictEqual(num)
    expect(reach(inst, 'nested.arr[].num', value, context)).toStrictEqual(num)
    expect(reach(inst, 'nested.arr.num', value, context)).toStrictEqual(num)

    // should fail b/c item[1] is used to resolve the schema
    expect(reach(inst, 'nested["arr"][1].num', value, context)).not.toStrictEqual(num)

    return reach(inst, 'nested.arr[].num', value, context)
      .isValid(5)
      .then(valid => {
        expect(valid).toStrictEqual(true)
      })
  })

  it('should handle lazy', async () => {
    const types = {
      1: object().shape({ foo: string() }),
      2: object().shape({ foo: number() }),
    }

    const lazySchema = lazy((val: any) => types[val.type])
    expect.assertions(1)
    await expect(
      object()
        .shape({
          x: array().of(lazySchema),
        })
        .strict()
        .validate({
          x: [{ type: 1, foo: '4' }, { type: 2, foo: '5' }],
        }),
    ).rejects.toThrow(/must be a `number` type/)
  })
})
