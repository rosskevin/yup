import { array, number, object } from 'yup'
import getIn from '../../src/util/getIn'

describe('getIn', () => {
  it('should getIn correctly', () => {
    const num = number()
    const inst = object().shape({
      num: number().max(4),

      nested: object().shape({
        arr: array().of(object().shape({ 'num-1': num })),
      }),
    })

    const value = { nested: { arr: [{}, { 'num-1': 2 }] } }
    const { schema, parent, parentPath } = getIn(inst, 'nested.arr[1].num-1', value)

    expect(schema).toStrictEqual(num)
    expect(parentPath).toStrictEqual('num-1')
    expect(parent).toMatchObject(value.nested.arr[1])
  })
})
