/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import rio from '../src';

describe('Rio', () => {
  afterEach(() => {
    rio.clear();
  });

  it('register schema object', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };
    const schema = 'app.builder';
    const schemaConfig = {
      schema,
      request: config,
    };

    rio.registerSchema(schemaConfig);
    const resolvedSchemaConfig = rio.resolveSchema(schema);

    expect(resolvedSchemaConfig).to.equal(schemaConfig);
  });

  it('register schema resolver', () => {
    rio.registerSchema((schema) => ({
      schema,
      request: {
        endpoint: `api.test.${schema}`,
      },
    }));

    const schemaName = 'app.builder';
    const resolvedSchemaConfig = rio.resolveSchema(schemaName);

    const expectedSchemaConfig = {
      schema: schemaName,
      request: {
        endpoint: `api.test.${schemaName}`,
      },
    }
    expect(resolvedSchemaConfig).to.deep.equal(expectedSchemaConfig);
  });

  it('resolve schema with blank rio', () => {
    const schemaName = 'app.builder';
    const resolvedSchemaConfig = rio.resolveSchema(schemaName);

    const expectedSchemaConfig = undefined;
    expect(resolvedSchemaConfig).to.equal(expectedSchemaConfig);
  });

  it('resolve schema with unsupported resolver', () => {
    rio.registerSchema(schema => undefined);

    const schemaName = 'app.builder';
    const resolvedSchemaConfig = rio.resolveSchema(schemaName);

    const expectedSchemaConfig = undefined;
    expect(resolvedSchemaConfig).to.equal(expectedSchemaConfig);
  });

  it('register with invalid schema', () => {
    expect(() => rio.registerSchema('Test'))
      .to.throw('Schema argument is invalid. Only object of function are allowed.');
  });
});
