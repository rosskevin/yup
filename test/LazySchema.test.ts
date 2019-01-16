import * as sinon from 'sinon'
import { lazy, MapToSchemaFn, mixed, MixedSchema } from 'yup'

describe('LazySchema', () => {
  it('should throw on a non-schema value', () => {
    const mapToSchema = () => undefined
    expect(() => lazy(mapToSchema as any).validate('foo')).toThrow()
  })

  describe('mapToSchema', () => {
    const value = 1
    let mapToSchema: sinon.SinonStub<any, MixedSchema>

    beforeEach(() => {
      mapToSchema = sinon.stub().returns(mixed())
    })

    it('should call with value', () => {
      lazy(mapToSchema).validate(value)
      expect(mapToSchema.calledWith(value)).toBeTruthy()
      // mapToSchema.should.have.been.calledWith(value)
    })

    it('should call with context', () => {
      const context = {
        a: 1,
      }
      lazy(mapToSchema).validate(value, { context })
      expect(mapToSchema.calledWithExactly(value, context)).toBeTruthy()
      // mapToSchema.should.have.been.calledWithExactly(value, context)
    })
  })
})
