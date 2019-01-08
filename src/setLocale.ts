import locale from './locale'

export function setLocale(customLocale: Partial<typeof locale>) {
  Object.keys(customLocale).forEach(type => {
    Object.keys(customLocale[type]).forEach(method => {
      locale[type][method] = customLocale[type][method]
    })
  })
}
