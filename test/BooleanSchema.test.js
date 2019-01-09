import { boolean } from '../src'
import { castAndShouldFail } from './helpers'

describe('Boolean types', () => {
  it('should CAST correctly', () => {
    let inst = boolean()

    expect(inst.cast('true')).toStrictEqual(true)
    expect(inst.cast('True')).toStrictEqual(true)
    expect(inst.cast('false')).toStrictEqual(false)
    expect(inst.cast('False')).toStrictEqual(false)
    expect(inst.cast(1)).toStrictEqual(true)
    expect(inst.cast(0)).toStrictEqual(false)

    castAndShouldFail(inst, 'foo')

    castAndShouldFail(inst, 'bar1')
  })

  it('should handle DEFAULT', () => {
    let inst = boolean()

    expect(inst.default()).toStrictEqual(undefined)
    inst
      .default(true)
      .required()
      .default()
    expect().toStrictEqual(true)
  })

  it('should type check', () => {
    let inst = boolean()

    expect(inst.isType(1)).toStrictEqual(false)
    expect(inst.isType(false)).toStrictEqual(true)
    expect(inst.isType('true')).toStrictEqual(false)
    expect(inst.isType(NaN)).toStrictEqual(false)
    expect(inst.isType(new Number('foooo'))).toStrictEqual(false)

    expect(inst.isType(34545)).toStrictEqual(false)
    expect(inst.isType(new Boolean(false))).toStrictEqual(true)

    expect(inst.isType(null)).toStrictEqual(false)

    inst.nullable().isType(null)
    expect().toStrictEqual(true)
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
          expect(err.errors.length).toStrictEqual(1)
          err.errors[0].should.contain('required')
        }),
    ])
  })
})
