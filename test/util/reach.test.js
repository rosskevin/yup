import { array, lazy, number, object, string } from '../../src'
import reach from '../../src/util/reach'

describe('reach', () => {
  it('should REACH correctly', async () => {
    var num = number(),
      inst = object().shape({
        num: number().max(4),

        nested: object().shape({
          arr: array().of(object().shape({ num: num })),
        }),
      })

    reach(inst, '').should.equal(inst)

    reach(inst, 'nested.arr.num').should.equal(num)
    reach(inst, 'nested.arr[].num').should.equal(num)
    reach(inst, 'nested.arr[1].num').should.equal(num)
    reach(inst, 'nested["arr"][1].num').should.not.equal(number())

    let valid = await reach(inst, 'nested.arr[].num').isValid(5)
    valid.should.equal(true)
  })

  it('should REACH conditionally correctly', function() {
    var num = number(),
      inst = object().shape({
        num: number().max(4),
        nested: object().shape({
          arr: array().when('$bar', function(bar) {
            return bar !== 3
              ? array().of(number())
              : array().of(
                  object().shape({
                    foo: number(),
                    num: number().when('foo', foo => {
                      if (foo === 5) return num
                    }),
                  }),
                )
          }),
        }),
      })

    let context = { bar: 3 }
    let value = {
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
    let types = {
      '1': object({ foo: string() }),
      '2': object({ foo: number() }),
    }

    let err = await object({
      x: array(lazy(val => types[val.type])),
    })
      .strict()
      .validate({
        x: [{ type: 1, foo: '4' }, { type: 2, foo: '5' }],
      })
      .should.be.rejected()
    err.message.should.match(/must be a `number` type/)
  })
})
