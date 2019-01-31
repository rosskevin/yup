import { locale, overrideLocale } from 'yup'

describe('overrideLocale', () => {
  it('should get default locale', () => {
    expect(locale.string.email).toStrictEqual('${path} must be a valid email')
  })

  it('should set a new locale', () => {
    const email = 'Invalid email'

    overrideLocale({
      string: {
        email,
      },
    })

    expect(locale.string.email).toStrictEqual(email)
  })

  it('should update the main locale', () => {
    expect(locale.string.email).toStrictEqual('Invalid email')
  })
})
