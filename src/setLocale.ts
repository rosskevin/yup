import locale from './locale'

export default function setLocale(customLocale: Partial<typeof locale>) {
  Object.keys(customLocale).forEach(type => {
    Object.keys(customLocale[type]).forEach(method => {
      locale[type][method] = customLocale[type][method]
    })
  })
}
