import _ from 'lodash';
import rio from '../rio';
import { createSchemasMap } from './ReduxApiStateDenormalizer';
import { resolveReferenceSchemaType } from '../resources';

const emptyObject = {};
Object.freeze(emptyObject);

const resolveStorageMap = _.memoize((state, schemaPaths) => createSchemasMap(state, schemaPaths));

/**
 * Connects rio configurations with denormalizer to simplify denormalization
 * of normalized data in state.
 * @param one - RIO one entity or primitive value
 * @param state
 * @param schema
 * @returns {{}}
 */
export function getOne(one, state, schema = '') {
  if ((_.isUndefined(one) || _.isNull(one))) {
    // Always return same reference.
    return emptyObject;
  }
  if (!_.isPlainObject(one) && !_.isString(one) && !_.isNumber(one)) {
    throw new Error('One must be object or primitive value.');
  }
  if (!_.isObject(state)) {
    throw new Error('State argument is invalid, should be an object.');
  }

  const resolvedSchema = resolveReferenceSchemaType(one, schema);

  const schemaPaths = rio.resourcePaths;
  if (!schemaPaths[resolvedSchema]) {
    throw new Error(`Storage for resolved schema ${resolvedSchema} doesn't exists in state.`);
  }

  const storageMap = resolveStorageMap(state, schemaPaths);

  return rio.denormalizer.denormalizeOne(one, storageMap, resolvedSchema);
}
