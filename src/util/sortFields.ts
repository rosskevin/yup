import has from 'lodash/has'
import { split } from 'property-expr'
import toposort from 'toposort'
import Ref from '../Reference'
import isSchema from './isSchema'

export default function sortFields(fields: any, excludes: any[] = []) {
  const edges: any[] = []
  const nodes: any[] = []

  function addNode(depPath: string, key: string) {
    const node = split(depPath)[0]

    // tslint:disable-next-line:no-bitwise
    if (!~nodes.indexOf(node)) {
      nodes.push(node)
    }

    // tslint:disable-next-line:no-bitwise
    if (!~excludes.indexOf(`${key}-${node}`)) {
      edges.push([key, node])
    }
  }

  for (const key in fields) {
    if (has(fields, key)) {
      const value = fields[key]

      // tslint:disable-next-line:no-bitwise
      if (!~nodes.indexOf(key)) {
        nodes.push(key)
      }

      if (Ref.isRef(value) && !value.isContext) {
        addNode(value.path, key)
      } else if (isSchema(value) && value._deps) {
        value._deps.forEach((path: string) => addNode(path, key))
      }
    }
  }

  return toposort.array(nodes, edges).reverse()
}
