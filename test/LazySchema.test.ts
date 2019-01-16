import * as sinon from 'sinon'
import { lazy, mixed } from 'yup'
import { MapToSchemaFn } from '../src/LazySchema'

describe('LazySchema', () => {
  it('should throw on a non-schema value', () => {
    const mapToSchema = () => undefined
    expect(() => lazy(mapToSchema as any).validate('foo')).toThrow()
  })

  describe('mapToSchema', () => {
    const value = 1
    let mapToSchema: MapToSchemaFn

    beforeEach(() => {
      mapToSchema = sinon.stub().returns(mixed())
    })

    it('should call with value', () => {
      lazy(mapToSchema).validate(value)
      mapToSchema.should.have.been.calledWith(value)
    })

    it('should call with context', () => {
      const context = {
        a: 1,
      }
      lazy(mapToSchema).validate(value, { context })
      mapToSchema.should.have.been.calledWithExactly(value, context)
    })
  })
})
