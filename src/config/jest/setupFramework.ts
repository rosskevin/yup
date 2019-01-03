import mixed from '../../mixed'

const g = global as any

g.chai = require('chai')
g.sinon = require('sinon')

g.chai.use(require('sinon-chai'))
g.chai.use(require('chai-as-promised'))
g.chai.use(require('dirty-chai'))

g.expect = g.chai.expect
g.chai.should()

// WTF???
Object.defineProperty(
  Promise.prototype,
  'should',
  (Object as any).getOwnPropertyDescriptor(Object.prototype, 'should'),
)

g.TestHelpers = require('../../../test/helpers')
g.specify = g.it

if (g.YUP_USE_SYNC) {
  const { validate } = mixed.prototype

  mixed.prototype.validate = function(value: any, options: any = {}) {
    options.sync = true
    return validate.call(this, value, options)
  }
}

g.specify = g.it
