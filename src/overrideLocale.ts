import { ArraySchema } from './ArraySchema'
import { BooleanSchema } from './BooleanSchema'
import { DateSchema } from './DateSchema'
import { locale } from './locale'
import { MixedSchema } from './MixedSchema'
import { NumberSchema } from './NumberSchema'
import { ObjectSchema } from './ObjectSchema/ObjectSchema'
import { StringSchema } from './StringSchema'

export interface LocaleOverride {
  mixed?: { [key in keyof MixedSchema]?: string }
  string?: { [key in keyof StringSchema]?: string }
  number?: { [key in keyof NumberSchema]?: string }
  boolean?: { [key in keyof BooleanSchema]?: string }
  date?: { [key in keyof DateSchema]?: string }
  array?: { [key in keyof ArraySchema<any>]?: string }
  object?: { [key in keyof ObjectSchema<any>]?: string }
}

export function overrideLocale(override: LocaleOverride) {
  Object.keys(override).forEach(type => {
    Object.keys(override[type]).forEach(method => {
      locale[type][method] = override[type][method]
    })
  })
}
