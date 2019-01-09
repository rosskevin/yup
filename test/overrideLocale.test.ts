import { overrideLocale } from '../src'

describe('Custom locale', () => {
  it('should get default locale', () => {
    const locale = require('../src/locale').default
    expect(locale.string.email).toStrictEqual('${path} must be a valid email')
  })

  it('should set a new locale', () => {
    const locale = require('../src/locale').default
    const email = 'Invalid email'

    overrideLocale({
      string: {
        email,
      },
    })

    expect(locale.string.email).toStrictEqual(email)
  })

  it('should update the main locale', () => {
    const locale = require('../src/locale').default
    expect(locale.string.email).toStrictEqual('Invalid email')
  })
})
