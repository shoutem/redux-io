import _ from 'lodash';
import { RSAA } from 'redux-api-middleware';
import {
  buildEndpoint,
  resolveResourceConfig,
  resolveSchemaResourceConfig,
  resolveSchemaType,
  getResourceType,
  JSON_API_RESOURCE,
} from '../resources';
import thunkAction from './_thunkAction';
import { extendMetaWithResponse, buildRSAAConfig } from '../rsaa';
import { normalize } from '../normalizer';

function prepareItem(item, schema) {
  if (item !== null) {
    if (!_.isObject(item)) {
      throw new Error('Item is not valid in method argument');
    }
    const normalizedItem = normalize(item, schema);
    return JSON.stringify({ data: normalizedItem });
  }

  return null;
}

function resolveTypes(types, meta) {
  const defaultTypes = [
    { meta },
    { meta: extendMetaWithResponse(meta) },
    { meta: extendMetaWithResponse(meta) },
  ];

  if (_.isString(types)) {
    return _.zipWith(
      defaultTypes,
      [
        { type: `@@redux_io/${types}_REQUEST` },
        { type: `@@redux_io/${types}_SUCCESS` },
        { type: `@@redux_io/${types}_ERROR` },
      ],
      _.merge,
    );
  }

  if (_.isArray(types)) {
    return _.zipWith(
      defaultTypes,
      types,
      _.merge,
    );
  }

  return null;
}

export function execute(config, params = {}, options = {}) {
  const {
    name,
    item,
    actionTypes,
    tag,
  } = config;

  const hasTag = _.has(config, 'tag');
  const hasItem = _.get(config, 'item');

  const resourceConfig = resolveResourceConfig(config, name);
  const schemaType = resolveSchemaType(resourceConfig);
  const resourceType = getResourceType(resourceConfig);

  if (!resourceConfig) {
    const schemaName = _.isObject(config) ? schemaType : config;
    throw new Error(`Couldn't resolve schema ${schemaName} in function ${name}.`);
  }
  if (hasTag && !_.isString(tag)) {
    throw new Error(`Invalid tag, "${name}" expected a string but got: ${JSON.stringify(tag)}`);
  }

  const rsaaConfig = buildRSAAConfig(resourceConfig);
  const endpoint = buildEndpoint(rsaaConfig.endpoint, params, options);

  const meta = {
    ...(hasTag && { tag }),
    params,
    endpoint,
    options,
    source: resourceType || JSON_API_RESOURCE,
    schema: schemaType,
    timestamp: Date.now(),
  };

  console.log('%%%%%%', resolveTypes(actionTypes, meta));

  return {
    [RSAA]: {
      ...rsaaConfig,
      endpoint,
      ...(hasItem && { body: prepareItem(item, resourceConfig) }),
      types: resolveTypes(actionTypes, meta),
    },
  };
}

export default thunkAction(execute);
