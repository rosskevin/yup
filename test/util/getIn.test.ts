import { array, number, object } from 'yup'
import getIn from '../../src/util/getIn'

describe('getIn', () => {
  it('should getIn correctly', async () => {
    const num = number()
    const inst = object().shape({
      num: number().max(4),

      nested: object().shape({
        arr: array().of(object().shape({ num })),
      }),
    })

    const value = { nested: { arr: [{}, { num: 2 }] } }
    const { schema, parent, parentPath } = getIn(inst, 'nested.arr[1].num', value)

    expect(schema).toStrictEqual(num)
    expect(parentPath).toStrictEqual('num')
    expect(parent).toStrictEqual(value.nested.arr[1])
  })
})
