import has from 'lodash/has'
import toposort from 'toposort'
import { Ref } from '../Ref'
import { split } from '../util/expression'
import { isSchema } from '../util/isSchema'
import { SchemaShape } from './ObjectSchema'

export default function sortFields(fields: SchemaShape, excludes: any[] = []) {
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
      } else if (isSchema(value) && (value as any)._deps) {
        // tslint:disable-next-line
        ;(value as any)._deps.forEach((path: string) => addNode(path, key))
      }
    }
  }

  return toposort.array(nodes, edges).reverse()
}
