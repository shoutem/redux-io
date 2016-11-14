import _ from 'lodash';
import rio from '../rio';
import { createSchemasMap } from './ReduxApiStateDenormalizer';
import { resolveSchemaName } from '../schemaConfig';

const emptyArray = [];
Object.freeze(emptyArray);

/**
 * Connects rio configurations with denormalizer to simplify denormalization
 * of normalized data in state.
 * @param state
 * @param collection
 * @param schema
 * @returns {[]}
 */
export function getCollection(collection, state, schema = '') {
  if (!collection) {
    // Handle undefined values reasonably
    // Always return same reference.
    return emptyArray;
  }

  if (!_.isArray(collection)) {
    throw new Error('Collection argument needs to be array.');
  }
  if (!_.isObject(state)) {
    throw new Error('State argument is invalid, should be an object.');
  }

  const resolvedSchema = resolveSchemaName(collection, schema);

  const schemaPaths = rio.schemaPaths;
  if (!schemaPaths[resolvedSchema]) {
    throw new Error(`Storage for resolved schema ${resolvedSchema} doesn't exists in state.`);
  }
  const storageMap = createSchemasMap(state, schemaPaths);

  return rio.denormalizer.denormalizeCollection(collection, storageMap, resolvedSchema);
}
