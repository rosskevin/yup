import { boolean } from '../src'

describe('Boolean types', () => {
  it('should CAST correctly', () => {
    let inst = boolean()

    inst.cast('true').should.equal(true)
    inst.cast('True').should.equal(true)
    inst.cast('false').should.equal(false)
    inst.cast('False').should.equal(false)
    inst.cast(1).should.equal(true)
    inst.cast(0).should.equal(false)

    TestHelpers.castAndShouldFail(inst, 'foo')

    TestHelpers.castAndShouldFail(inst, 'bar1')
  })

  it('should handle DEFAULT', () => {
    let inst = boolean()

    expect(inst.default()).toStrictEqual(undefined)
    inst
      .default(true)
      .required()
      .default()
      .should.equal(true)
  })

  it('should type check', () => {
    let inst = boolean()

    inst.isType(1).should.equal(false)
    inst.isType(false).should.equal(true)
    inst.isType('true').should.equal(false)
    inst.isType(NaN).should.equal(false)
    inst.isType(new Number('foooo')).should.equal(false)

    inst.isType(34545).should.equal(false)
    inst.isType(new Boolean(false)).should.equal(true)

    expect(inst.isType(null)).toStrictEqual(false)

    inst
      .nullable()
      .isType(null)
      .should.equal(true)
  })

  it('boolean should VALIDATE correctly', () => {
    let inst = boolean().required()

    return Promise.all([
      boolean()
        .isValid('1')
        .should.eventually()
        .equal(true),
      boolean()
        .strict()
        .isValid(null)
        .should.eventually()
        .equal(false),
      boolean()
        .nullable()
        .isValid(null)
        .should.eventually()
        .equal(true),
      inst
        .validate()
        .should.be.rejected()
        .then(err => {
          err.errors.length.should.equal(1)
          err.errors[0].should.contain('required')
        }),
    ])
  })
})
