import _ from 'lodash';
import rio from '../rio';
import { createSchemasMap } from './ReduxApiStateDenormalizer';
import { resolveReferenceSchemaType } from '../resources';

const emptyArray = [];
Object.freeze(emptyArray);

let lastState = null;
let lastSchemaPaths = null;
let storageMap = null;

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

  const resolvedSchema = resolveReferenceSchemaType(collection, schema);

  const schemaPaths = rio.resourcePaths;
  if (!schemaPaths[resolvedSchema]) {
    throw new Error(`Storage for resolved schema ${resolvedSchema} doesn't exists in state.`);
  }

  // TODO: use memoization https://www.npmjs.com/package/mem, https://www.npmjs.com/package/memoizee
  if (
    state !== lastState ||
    schemaPaths !== lastSchemaPaths ||
    !storageMap
  ) {
    storageMap = createSchemasMap(state, schemaPaths);
    lastState = state;
    lastSchemaPaths = schemaPaths;
  }

  return rio.denormalizer.denormalizeCollection(collection, storageMap, resolvedSchema);
}
