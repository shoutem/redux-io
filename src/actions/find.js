import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  middlewareJsonApiSource,
} from './../middleware';
import { buildEndpoint, resolveConfig } from './../schemaConfig';

/**
 * Action creator used to fetch data from api (GET). Find function expects schema name of
 * data which correspond with storage reducer or schema configuration object. In both cases
 * rio resolves schema with registered schema configurations, and in case of schema
 * configuration passed in argument it merges two configuration objects. Schema configuration
 * object holds config.request attribute which is configuration based on RSAA
 * configuration from redux-api-middleware, allowing full customization expect types
 * part of configuration. Tag arg is optional, but when used allows your collections with same
 * tag value to respond on received data.
 * @param schema
 * @param tag
 * @param params
 * @returns action
 */
export default (schema, tag = '', params = {}) => {
  const config = resolveConfig(schema);
  if (!config) {
    const schemaName = schema && _.isObject(schema) ? schema.schema : schema;
    throw new Error(`Couldn't resolve schema ${schemaName} in function find.`);
  }
  if (!_.isString(tag)) {
    throw new Error('Tag isn\'t string.');
  }

  const meta = {
    source: middlewareJsonApiSource,
    schema: config.schema,
    tag,
  };
  const endpoint = buildEndpoint(config.request.endpoint, params);

  return {
    [RSAA]: {
      method: 'GET',
      ...config.request,
      endpoint,
      types: [
        {
          type: LOAD_REQUEST,
          meta,
        },
        {
          type: LOAD_SUCCESS,
          meta,
        },
        {
          type: LOAD_ERROR,
          meta,
        },
      ],
    },
  };
};
