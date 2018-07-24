/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import _ from 'lodash';
import {
  resolveResourceConfig,
  jsonApiResourceTypeConfig,
} from '../../src/resources';
import rio from '../../src';

describe('Resolve resource config', () => {
  afterEach(() => {
    rio.clear();
  });

  it('create custom config', () => {
    const expectedConfig = { schema: 'test', type: 'custom' };
    const config = resolveResourceConfig(expectedConfig);

    expect(config).to.deep.equal(expectedConfig);
  });

  it('override json-api config with arg config', () => {
    const argConfig = { schema: 'test', request: { endpoint: '', method: 'GET' }};
    const config = resolveResourceConfig(argConfig);

    const expectedConfig = _.chain({ standardizer: {}})
      .merge(jsonApiResourceTypeConfig, argConfig)
      .omit('actions')
      .value();

    expect(config).to.deep.equal(expectedConfig);
  });

  it('override action json-api config with arg config', () => {
    const argConfig = { schema: 'test', request: { endpoint: '', method: 'GET' }};
    const config = resolveResourceConfig(argConfig, 'create');

    const expectedJsonApiResourceConfig = _.merge(
      {},
      jsonApiResourceTypeConfig,
      jsonApiResourceTypeConfig.actions['create']
    );

    const expectedConfig = _.chain({ standardizer: {}})
      .merge(expectedJsonApiResourceConfig, argConfig)
      .omit('actions')
      .value();

    expect(config).to.deep.equal(expectedConfig);
  });

  it('override from type to schema to arg config', () => {
    const resourceTypeConfig = {
      type: 'test',
      request: {
        method: 'A',
        headers: {
          A: 'A',
        },
      },
      standardizer: {},
    };
    rio.registerResourceType(resourceTypeConfig);

    const schemaTypeConfig = {
      schema: 'B',
      type: 'test',
      request: {
        method: 'B',
        endpoint: 'B',
      }
    };
    rio.registerResource(schemaTypeConfig);

    const argConfig = {
      schema: 'B',
      type: 'test',
      request: {
        endpoint: 'C',
      }
    };
    const config = resolveResourceConfig(argConfig);

    const expectedConfig = {
      schema: 'B',
      type: 'test',
      request: {
        method: 'B',
        endpoint: 'C',
        headers: {
          A: 'A',
        },
      },
      standardizer: {},
    };

    expect(config).to.deep.equal(expectedConfig);
  });
});
