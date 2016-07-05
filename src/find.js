import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  LOAD_REQUEST,
  LOAD_SUCCESS,
  LOAD_ERROR,
  middlewareJsonApiSource,
} from './middleware';
import rio from './rio';

/**
 * Replace endpoint placeholders '{key}' with corresponding value of key in params dict.
 * Unused params are resolved into query params as 'key=value' pairs and concatenated to endpoint
 * @param endpoint
 * @param params
 * @returns {string}
 */
function buildEndpoint(endpoint, params) {
  const usedParams = [];
  const paramEndpoint = endpoint.replace(/{(\w+)}/g, (match, key) => {
    usedParams.push(key);
    return params[key];
  });
  const unusedParamKeys = _.difference(Object.keys(params), usedParams);
  const queryParams = unusedParamKeys.map(key => `${key}=${params[key]}`);
  if (_.isEmpty(queryParams)) {
    return paramEndpoint;
  }
  return `${paramEndpoint}?${queryParams.join('&')}`;
}

/**
 * Encapsulates additional logic around rio.resolveSchema. In case schema argument is object,
 * function merges argument configuration with registered configuration in rio. Allowing
 * overriding base configuration.
 * @param schema
 * @returns config
 */
function resolveConfig(schema) {
  if (_.isString(schema)) {
    return rio.resolveSchema(schema);
  } else if (_.isObject(schema)) {
    const argConfig = schema;
    const rioConfig = rio.resolveSchema(argConfig.schema);
    return _.merge(rioConfig, argConfig);
  }
  return undefined;
}

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
    throw new Error('Schema is invalid.');
  }
  if (!_.isString(tag)) {
    throw new Error('Tag isn\'t string.');
  }
  if (!_.has(config, 'request.endpoint')) {
    throw new Error('Undefined configuration request endpoint.');
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
