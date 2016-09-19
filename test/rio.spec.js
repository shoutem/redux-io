/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import rio, { JSON_API_SOURCE } from '../src';

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
    const resolvedSchemaConfig = rio.getSchema(schema);

    expect(resolvedSchemaConfig).to.deep.equal(schemaConfig);
  });

  it('register schema resolver', () => {
    rio.registerSchema((schema) => ({
      schema,
      request: {
        endpoint: `api.test.${schema}`,
        headers: {},
      },
    }));

    const schemaName = 'app.builder';
    const resolvedSchemaConfig = rio.getSchema(schemaName);

    const expectedSchemaConfig = {
      schema: schemaName,
      request: {
        endpoint: `api.test.${schemaName}`,
        headers: {},
      },
    };
    expect(resolvedSchemaConfig).to.deep.equal(expectedSchemaConfig);
  });

  it('return schema config clone to the outside callers to prevent mutations', () => {
    rio.registerSchema((schema) => ({
      schema,
      request: {
        endpoint: `api.test.${schema}`,
        headers: {},
      },
    }));

    const schemaName = 'app.builder';
    const resolvedSchemaConfig = rio.getSchema(schemaName);

    const expectedSchemaConfig = {
      schema: schemaName,
      request: {
        endpoint: `api.test.${schemaName}`,
        headers: {},
      },
    };
    expect(resolvedSchemaConfig).to.not.equal(expectedSchemaConfig);
    expect(resolvedSchemaConfig).to.deep.equal(expectedSchemaConfig);
  });

  it('register schema resolver that returns invalid schema', () => {
    rio.registerSchema((schema) => ({
      schema,
      request: {
        endpoint: `api.test.${schema}`,
      },
    }));

    const schemaName = 'app.builder';
    expect(() => rio.getSchema(schemaName))
      .to.throw('Schema configuration is invalid. Error:'
      + ' [{"code":"OBJECT_MISSING_REQUIRED_PROPERTY","params":["headers"],'
      + '"message":"Missing required property: headers","path":"#/request"}].'
      + ' Invalid schema config: {"schema":"app.builder","request":{"endpoint"'
      + ':"api.test.app.builder"}}');
  });

  it('resolve schema with blank rio', () => {
    const schemaName = 'app.builder';
    const resolvedSchemaConfig = rio.getSchema(schemaName);

    const expectedSchemaConfig = undefined;
    expect(resolvedSchemaConfig).to.equal(expectedSchemaConfig);
  });

  it('resolve schema with unsupported resolver', () => {
    rio.registerSchema(schema => undefined);

    const schemaName = 'app.builder';
    const resolvedSchemaConfig = rio.getSchema(schemaName);

    const expectedSchemaConfig = undefined;
    expect(resolvedSchemaConfig).to.equal(expectedSchemaConfig);
  });

  it('register with invalid schema config type', () => {
    expect(() => rio.registerSchema('Test'))
      .to.throw('Schema argument is invalid. Only object of function are allowed.');
  });

  it('register invalid schema object', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      schema: 'api.test',
    };
    const schema = 'app.builder';
    const schemaConfig = {
      schema,
      request: config,
    };

    expect(() => rio.registerSchema(schemaConfig))
      .to.throw('Schema configuration is invalid. Error:'
      + ' [{"code":"OBJECT_ADDITIONAL_PROPERTIES","params":[["schema"]],'
      + '"message":"Additional properties not allowed: schema","path":"#/request"}].'
      + ' Invalid schema config: ' + JSON.stringify(schemaConfig));
  });

  it('register source type', () => {
    rio.registerSourceType('test_source', () => true);
    const standardizer = rio.getStandardizer('test_source');

    expect(standardizer).to.not.be.undefined;
    const result = standardizer();
    expect(result).to.be.true;
  });

  it('throws error if source type argument isn\'t string on registration of source type', () => {
    expect(() => rio.registerSourceType({}, () => true)).to.throw(
      'rio.registerSourceType sourceType argument must be string.'
    );
  });

  it('throws error if source type argument is empty on registration of source type', () => {
    expect(() => rio.registerSourceType('', () => true)).to.throw(
      'rio.registerSourceType sourceType is empty.'
    );
  });

  it('throws error if standardizer argument isn\'t function on registration of source type', () => {
    expect(() => rio.registerSourceType('test', {})).to.throw(
      'rio.registerSourceType standardizer argument must be a function.'
    );
  });

  it('resolve default JSON-API standardizer', () => {
    const standardizer = rio.getStandardizer(JSON_API_SOURCE);
    expect(standardizer).to.not.be.undefined;
  });

  it('throws error if source type argument isn\'t string on getStandardizer', () => {
    expect(() => rio.getStandardizer({})).to.throw(
      'rio.getStandardizer sourceType argument must be string.'
    );
  });

  it('throws error if source type argument is empty on getStandardizer', () => {
    expect(() => rio.getStandardizer('')).to.throw(
      'rio.getStandardizer sourceType is empty.'
    );
  });
});
