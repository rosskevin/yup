import { settled } from '../src/util/runValidations'
import { object, array, string, lazy, number } from '../src'

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
          results.length.should.equal(2)
          results[0].fulfilled.should.equal(true)
          results[0].value.should.equal('hi')
          results[1].fulfilled.should.equal(false)
          results[1].value.should.equal('error')
        }),
    ])
  })
})
