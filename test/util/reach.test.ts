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

    reach(inst, '').should.equal(inst)

    reach(inst, 'nested.arr.num').should.equal(num)
    reach(inst, 'nested.arr[].num').should.equal(num)
    reach(inst, 'nested.arr[1].num').should.equal(num)
    reach(inst, 'nested["arr"][1].num').should.not.equal(number())

    const valid = await reach(inst, 'nested.arr[].num').isValid(5)
    valid.should.equal(true)
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
                  num: number().when('foo', foo => {
                    if (foo === 5) {
                      return num
                    }
                    return undefined
                  }),
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

    reach(inst, 'nested.arr.num', value).should.equal(num)
    reach(inst, 'nested.arr[].num', value).should.equal(num)

    reach(inst, 'nested.arr.num', value, context).should.equal(num)
    reach(inst, 'nested.arr[].num', value, context).should.equal(num)
    reach(inst, 'nested.arr[0].num', value, context).should.equal(num)

    // should fail b/c item[1] is used to resolve the schema
    reach(inst, 'nested["arr"][1].num', value, context).should.not.equal(num)

    return reach(inst, 'nested.arr[].num', value, context)
      .isValid(5)
      .then(valid => {
        valid.should.equal(true)
      })
  })

  it('should reach through lazy', async () => {
    const types = {
      1: object({ foo: string() }),
      2: object({ foo: number() }),
    }

    // const err = await object({
    //   x: array(lazy(val => types[val.type])),
    // })
    //   .strict()
    //   .validate({
    //     x: [{ type: 1, foo: '4' }, { type: 2, foo: '5' }],
    //   })
    // .should.be.rejected()
    // (err as any).message.should.match(/must be a `number` type/)

    const lazySchema = lazy((val: any) => types[val.type])
    expect(
      object({
        x: array(lazySchema),
      })
        .strict()
        .validate({
          x: [{ type: 1, foo: '4' }, { type: 2, foo: '5' }],
        }),
    ).rejects.toMatch(/must be a `number` type/)
  })
})
