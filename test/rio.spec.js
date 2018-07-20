/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import rio, { JSON_API_RESOURCE } from '../src';

describe('Rio', () => {
  afterEach(() => {
    rio.clear();
  });

  it('register resource object', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };
    const schema = 'app.builder';
    const resourceConfig = {
      schema,
      request: config,
    };

    rio.registerSchema(resourceConfig);
    const resolvedSchemaConfig = rio.getSchema(schema);

    expect(resolvedSchemaConfig).to.deep.equal(resourceConfig);
  });

  it('register resource object with schema object', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };
    const schemaType = 'app.builder';
    const schema = {
      type: schemaType,
      relationships: {
        cars: {
          type: 'core.cars',
        },
        owners: {
          type: 'core.users',
        },
      },
    };
    const resourceConfig = {
      schema,
      request: config,
    };

    rio.registerResource(resourceConfig);
    const resolvedSchemaConfig = rio.getResource(schemaType);

    expect(resolvedSchemaConfig).to.deep.equal(resourceConfig);
  });

  it('register schema object with actions', () => {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
      endpoint: 'api.test',
    };
    const schema = 'app.builder';
    const actions = {
      get: {
        request: {
          method: 'GET',
        },
      },
      create: {
        request: {
          method: 'POST',
        },
      },
      update: {
        request: {
          method: 'PATCH',
        },
      },
      remove: {
        request: {
          method: 'DELETE',
        },
      },
    };

    const schemaConfig = {
      schema,
      request: config,
      actions,
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
      .to.throw('Resource configuration is invalid. Error:'
      + ' [{"code":"OBJECT_MISSING_REQUIRED_PROPERTY","params":["headers"],'
      + '"message":"Missing required property: headers","path":"#/request"}].'
      + ' Invalid resource config: {"schema":"app.builder","request":{"endpoint"'
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
      .to.throw('Register argument is invalid. Only object of function are allowed.');
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
      type: 'custom',
      request: config,
    };

    expect(() => rio.registerSchema(schemaConfig))
      .to.throw('Resource configuration is invalid. Error:'
      + ' [{"code":"OBJECT_ADDITIONAL_PROPERTIES","params":[["schema"]],'
      + '"message":"Additional properties not allowed: schema","path":"#/request"}].'
      + ' Invalid resource config: ' + JSON.stringify(schemaConfig));
  });

  it('register source type', () => {
    rio.registerResourceType({ type: 'test_source', standardizer: {}});
    const standardizer = rio.getStandardizer('test_source');

    expect(standardizer).to.not.be.undefined;
  });

  it('throws error if source type argument isn\'t string on registration of source type', () => {
    expect(() => rio.registerResourceType({ type: {}, standardizer: {} })).to.throw(
      'rio.registerResourceType type argument must be string.'
    );
  });

  it('throws error if source type argument is empty on registration of resource type', () => {
    expect(() => rio.registerResourceType({ type: '', standardizer: {}})).to.throw(
      'rio.registerResourceType type is empty.'
    );
  });

  it('throws error if standardizer argument isn\'t object on registration of resource type', () => {
    expect(() => rio.registerResourceType({ type: 'test', standardizer: null })).to.throw(
      'rio.registerResourceType standardizer argument must be an object.'
    );
  });

  it('resolve default JSON-API standardizer', () => {
    const standardizer = rio.getStandardizer(JSON_API_RESOURCE);
    expect(standardizer).to.not.be.undefined;
  });

  it('throws error if source type argument isn\'t string on getStandardizer', () => {
    expect(() => rio.getStandardizer({})).to.throw(
      'rio.getStandardizer resourceType argument must be string.'
    );
  });

  it('throws error if resource type argument is empty on getStandardizer', () => {
    expect(() => rio.getStandardizer('')).to.throw(
      'rio.getStandardizer resourceType is empty.'
    );
  });
});
