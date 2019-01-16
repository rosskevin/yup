import { MessageFormatter } from '../../src/types'
import formatError from '../../src/util/formatError'

describe('formatError', () => {
  it('should insert the params into the message', () => {
    const str = formatError('Some message ${param}', {
      param: 'here',
    })
    expect(str).toMatch(/here/)
  })

  it(`should auto include any param named 'label' or 'path' as the 'path' param`, () => {
    const str = formatError('${path} goes here', {
      label: 'label',
    })
    expect(str).toMatch(/label/)
  })

  it(`should use 'this' if a 'label' or 'path' param is not provided`, () => {
    const str = formatError('${path} goes here', {})
    expect(str).toMatch(/this/)
  })

  it(`should return the validation function if only a message is provided`, () => {
    const str = (formatError('${path} goes here') as MessageFormatter)({})
    expect(str).toMatch(/this/)
  })

  it(`should include "undefined" in the message if undefined is provided as a param`, () => {
    const str = formatError('${path} value is ${min}', {
      min: undefined,
    })
    expect(str).toMatch(/undefined/)
  })

  it(`should include "null" in the message if null is provided as a param`, () => {
    const str = formatError('${path} value is ${min}', {
      min: null,
    })
    expect(str).toMatch(/null/)
  })

  it(`should include "NaN" in the message if null is provided as a param`, () => {
    const str = formatError('${path} value is ${min}', {
      min: NaN,
    })
    expect(str).toMatch(/NaN/)
  })

  it(`should include 0 in the message if 0 is provided as a param`, () => {
    const str = formatError('${path} value is ${min}', {
      min: 0,
    })
    expect(str).toMatch(/0/)
  })
})
