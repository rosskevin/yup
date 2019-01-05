import merge from '../../src/util/merge'

describe('merge', () => {
  it('should merge', () => {
    const a = { a: 1, b: 'hello', c: [1, 2, 3], d: { a: /hi/ }, e: { b: 5 } }
    const b = { a: 4, c: [4, 5, 3], d: { b: 'hello' }, f: { c: 5 }, g: null }

    expect(merge(a, b)).toMatchObject({
      a: 4,
      b: 'hello',
      c: [1, 2, 3, 4, 5, 3],
      d: {
        a: /hi/,
        b: 'hello',
      },
      e: { b: 5 },
      f: { c: 5 },
      g: null,
    })
  })
})
