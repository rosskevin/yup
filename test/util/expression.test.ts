import {
  Cache,
  forEach,
  getter,
  join,
  normalizePath,
  setter,
  split,
} from '../../src/util/expression'

const obj = {
  foo: {
    bar: ['baz', 'bux'],
    fux: 5,
    // tslint:disable-next-line:object-literal-sort-keys
    '00N40000002S5U0': 1,
    N40000002S5U0: 2,
    'FE43-D880-21AE': 3,
  },
}

describe('expression', () => {
  it('getter', () => {
    expect(getter('foo.fux')(obj)).toStrictEqual(5)
    expect(getter('foo.bar')(obj)).toMatchObject(['baz', 'bux'])

    expect(getter('foo.bar[1]')(obj)).toStrictEqual('bux')
    expect(getter('["foo"]["bar"][1]')(obj)).toStrictEqual('bux')
    expect(getter('[1]')([1, 'bux'])).toStrictEqual('bux')
  })
  it('getter safe access', () => {
    expect(getter('foo.fux', true)(obj)).toStrictEqual(5)
    expect(getter('foo.bar', true)(obj)).toMatchObject(['baz', 'bux'])

    expect(getter('foo.bar[1]', true)(obj)).toStrictEqual('bux')
    expect(getter('["foo"]["bar"][1]', true)(obj)).toStrictEqual('bux')
    expect(getter('[1]', true)([1, 'bux'])).toStrictEqual('bux')

    expect(getter('foo.gih.df[0]', true)(obj)).toBeUndefined()
    expect(getter('["fr"]["bzr"][1]', true)(obj)).toBeUndefined()

    expect(getter('foo["00N40000002S5U0"]', true)(obj)).toStrictEqual(1)
    expect(getter('foo.00N40000002S5U0', true)(obj)).toStrictEqual(1)
    expect(getter('foo["N40000002S5U0"]', true)(obj)).toStrictEqual(2)
    expect(getter('foo.N40000002S5U0', true)(obj)).toStrictEqual(2)
    expect(getter('foo["FE43-D880-21AE"]', true)(obj)).toStrictEqual(3)
    expect(getter('foo.FE43-D880-21AE', true)(obj)).toStrictEqual(3)
  })

  it('setter', () => {
    setter('foo.fux')(obj, 10)
    expect(obj.foo.fux).toStrictEqual(10)

    setter('foo.bar[1]')(obj, 'bot')
    expect(obj.foo.bar[1]).toStrictEqual('bot')

    setter('[\'foo\']["bar"][1]')(obj, 'baz')
    expect(obj.foo.bar[1]).toStrictEqual('baz')
  })

  it('cache', () => {
    const cache = new Cache(3)
    expect(cache.size).toStrictEqual(0)
    expect(cache.set('a', obj)).toMatchObject(obj)
    expect(cache.get('a')).toMatchObject(obj)
    expect(cache.size).toStrictEqual(1)
    expect(cache.set('b', 123)).toStrictEqual(123)
    expect(cache.get('b')).toStrictEqual(123)
    expect(cache.set('b', 321)).toStrictEqual(321)
    expect(cache.get('b')).toStrictEqual(321)
    expect(cache.set('c', null)).toBeNull()
    expect(cache.get('c')).toBeNull()
    expect(cache.size).toStrictEqual(3)
    expect(cache.set('d', 444)).toStrictEqual(444)
    expect(cache.size).toStrictEqual(1)
    cache.clear()
    expect(cache.size).toStrictEqual(0)
    expect(cache.get('a')).toBeUndefined()
  })

  it('split', () => {
    const parts = split('foo.baz["bar"][1]')
    expect(parts.length).toStrictEqual(4)
  })

  it('join', () => {
    const parts = split('foo.baz["bar"][1]')
    expect(join(['0', 'baz', '"bar"', 1])).toStrictEqual('[0].baz["bar"][1]')
    expect(join(parts)).toStrictEqual('foo.baz["bar"][1]')
  })

  it('forEach', () => {
    let count = 0

    forEach('foo.baz["bar"][1]', (part, isBracket, isArray, idx) => {
      count = idx

      switch (idx) {
        case 0:
          expect(part).toStrictEqual('foo')
          expect(isBracket).toStrictEqual(false)
          expect(isArray).toStrictEqual(false)
          break
        case 1:
          expect(part).toStrictEqual('baz')
          expect(isBracket).toStrictEqual(false)
          expect(isArray).toStrictEqual(false)
          break
        case 2:
          expect(part).toStrictEqual('"bar"')
          expect(isBracket).toStrictEqual(true)
          expect(isArray).toStrictEqual(false)
          break
        case 3:
          expect(part).toStrictEqual('1')
          expect(isBracket).toStrictEqual(false)
          expect(isArray).toStrictEqual(true)
          break
      }
    })

    expect(count).toStrictEqual(3)
  })

  it('normalizePath', () => {
    expect(normalizePath('foo[ " bux\'s " ].bar["baz"][ 9 ][ \' s \' ]')).toMatchObject([
      'foo',
      ` bux's `,
      'bar',
      'baz',
      '9',
      ' s ',
    ])
  })
})
