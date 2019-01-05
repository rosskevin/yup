import { ValidationError } from '../src'

describe('ValidationError', () => {
  const ve = new ValidationError('a message', 'a value', 'a.path', 'aType')
  it('name', () => {
    expect(ve.name).toStrictEqual('ValidationError')
  })

  it('instanceof', () => {
    expect(ve instanceof ValidationError).toStrictEqual(true)
  })

  it('typeof', () => {
    expect(typeof ve).toStrictEqual('object')
  })
})
