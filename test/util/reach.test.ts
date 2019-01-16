import { array, lazy, number, object, reach, string } from '../../src'

describe('reach', () => {
  it('should REACH correctly', async () => {
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
    expect(reach(inst, 'nested.arr[1].num')).toStrictEqual(num)
    expect(reach(inst, 'nested["arr"][1].num')).not.toStrictEqual(number())

    const valid = await reach(inst, 'nested.arr[].num').isValid(5)
    expect(valid).toStrictEqual(true)
  })

  it('should REACH conditionally correctly', () => {
    const num = number()
    const inst = object().shape({
      nested: object().shape({
        arr: array().when('$bar', bar => {
          return bar.length !== 3
            ? array().of(number())
            : array().of(
                object().shape({
                  foo: number(),
                  num: number().when('foo', (values, schema) =>
                    values[0] === 5 ? num : undefined,
                  ),
                }),
              )
        }),
      }),
      num: number().max(4),
    })

    const context = { bar: 3 }
    const value = {
      bar: 3,
      nested: {
        arr: [{ foo: 5 }, { foo: 3 }],
      },
    }

    expect(reach(inst, 'nested.arr.num', value)).toStrictEqual(num)
    expect(reach(inst, 'nested.arr[].num', value)).toStrictEqual(num)

    expect(reach(inst, 'nested.arr.num', value, context)).toStrictEqual(num)
    expect(reach(inst, 'nested.arr[].num', value, context)).toStrictEqual(num)
    expect(reach(inst, 'nested.arr[0].num', value, context)).toStrictEqual(num)

    // should fail b/c item[1] is used to resolve the schema
    expect(reach(inst, 'nested["arr"][1].num', value, context)).not.toStrictEqual(num)

    return reach(inst, 'nested.arr[].num', value, context)
      .isValid(5)
      .then(valid => {
        expect(valid).toStrictEqual(true)
      })
  })

  it('should reach through lazy', async () => {
    const types = {
      1: object().shape({ foo: string() }),
      2: object().shape({ foo: number() }),
    }

    // const err = await object().shape({
    //   x: array(lazy(val => types[val.type])),
    // })
    //   .strict()
    //   .validate({
    //     x: [{ type: 1, foo: '4' }, { type: 2, foo: '5' }],
    //   })
    // .should.be.rejected()
    // (err as any).message.should.match(/must be a `number` type/)

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
    ).rejects.toMatch(/must be a `number` type/)
  })
})
