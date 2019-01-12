import { settled } from '../src/util/runValidations'
import { object, array, string, lazy, number } from 'yup'

describe('Yup', function() {
  it('cast should not assert on undefined', () => {
    ;(() => string().cast(undefined)).should.not.throw()
  })

  it('cast should assert on undefined cast results', () => {
    ;(() =>
      string()
        .transform(() => undefined)
        .cast('foo')).should.throw()
  })

  it('cast should respect assert option', () => {
    ;(() => string().cast(null)).should.throw()
    ;(() => string().cast(null, { assert: false })).should.not.throw()
  })

  it('should do settled', function() {
    return Promise.all([
      settled([Promise.resolve('hi'), Promise.reject('error')])
        .should.be.fulfilled()
        .then(function(results) {
          expect(results.length).toStrictEqual(2)
          expect(results[0].fulfilled).toStrictEqual(true)
          expect(results[0].value).toStrictEqual('hi')
          expect(results[1].fulfilled).toStrictEqual(false)
          expect(results[1].value).toStrictEqual('error')
        }),
    ])
  })
})
