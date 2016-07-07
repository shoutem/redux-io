import _ from 'lodash';
import rio from '../rio';
import { createSchemasMap } from './ReduxApiStateDenormalizer';
import { getStatus } from '../status';

/**
 * Connects rio configurations with denormalizer to simplify denormalization
 * of normalized data in state.
 * @param state
 * @param collection
 * @param schema
 * @returns {{}}
 */
export function getCollection(collection, state, schema = '') {
  if (!_.isObject(state)) {
    throw new Error('State is invalid, should be an object.');
  }
  if (!_.isArray(collection)) {
    throw new Error('Collection argument needs to be array.');
  }

  let resolvedSchema = schema;
  const status = getStatus(collection);
  if (status) {
    resolvedSchema = status.schema;
  }

  if (!_.isString(resolvedSchema) || _.isEmpty(resolvedSchema)) {
    throw new Error(
      `Schema name is invalid. Check collection
      configuration or passed schema argument`
    );
  }

  const schemaPaths = rio.schemaPaths;
  if (!schemaPaths[resolvedSchema]) {
    throw new Error(`Storage for resolved schema ${resolvedSchema} doesn't exists in state.`);
  }
  const storageMap = createSchemasMap(state, schemaPaths);

  return rio.denormalizer.denormalizeCollection(collection, resolvedSchema, storageMap);
}
