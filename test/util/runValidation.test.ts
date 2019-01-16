import { settled } from '../../src/util/runValidations'

describe('runValidation', () => {
  it('should do settled', async () => {
    expect.assertions(1)
    await expect(
      settled([Promise.resolve('hi'), Promise.reject('error')], false),
    ).resolves.toMatchObject([
      { fulfilled: true, value: 'hi' },
      { fulfilled: false, value: 'error' },
    ])
  })
})

//  expect(results.length).toStrictEqual(2)
//  expect(results[0].fulfilled).toStrictEqual(true)
//  expect(results[0].value).toStrictEqual('hi')
//  expect(results[1].fulfilled).toStrictEqual(false)
//  expect(results[1].value).toStrictEqual('error')
