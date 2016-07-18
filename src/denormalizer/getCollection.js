import _ from 'lodash';
import rio from '../rio';
import { createSchemasMap } from './ReduxApiStateDenormalizer';
import { getStatus } from '../status';

function resolveSchemaName(collection, schema) {
  const collectionSchema = _.get(getStatus(collection), 'schema');

  const isCollectionSchemaValid = !_.isEmpty(collectionSchema) && _.isString(collectionSchema);
  const isArgumentSchemaValid = !_.isEmpty(schema) && _.isString(schema);

  if (isCollectionSchemaValid && isArgumentSchemaValid) {
    console.warn(
      `getCollection gets both collection schema (${collectionSchema})`
    + ` and argument schema (${schema}). Collection schema has priority`
    + ' over schema argument.'
    );
  }
  if (!isCollectionSchemaValid && !isArgumentSchemaValid) {
    throw new Error(
      'Missing schema name in getCollection function. Schema needs to'
    + ' be defined in collection or as argument.'
    );
  }

  if (isCollectionSchemaValid) {
    return collectionSchema;
  }
  return schema;
}

/**
 * Connects rio configurations with denormalizer to simplify denormalization
 * of normalized data in state.
 * @param state
 * @param collection
 * @param schema
 * @returns {{}}
 */
export function getCollection(collection, state, schema = '') {
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
