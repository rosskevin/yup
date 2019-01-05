import getIn from './getIn'

export default function reach(obj: any, path: string, value: any, context: any) {
  return getIn(obj, path, value, context).schema
}
