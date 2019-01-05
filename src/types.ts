// tslint:disable-next-line:ban-types
export type Value = number | string | Function | null | boolean | Date

export interface Params {
  path: string
  label?: string
}
