import _ from 'lodash';
import { getStatus } from '../../status';

export function resolveSchemaName(reference, schema) {
  const referenceSchema = _.get(getStatus(reference), 'schema');

  const isReferenceSchemaValid = !_.isEmpty(referenceSchema) && _.isString(referenceSchema);
  const isArgumentSchemaValid = !_.isEmpty(schema) && _.isString(schema);

  if (isReferenceSchemaValid && isArgumentSchemaValid) {
    // eslint-disable-next-line no-console
    console.warn(
      `getCollection or getOne gets both reference schema (${referenceSchema})`
      + ` and argument schema (${schema}). Reference schema has priority`
      + ' over schema argument.'
    );
  }
  if (!isReferenceSchemaValid && !isArgumentSchemaValid) {
    throw new Error(
      'Missing schema name in getCollection or getOne function. Schema needs to'
      + ' be defined in reference or as argument.'
    );
  }

  if (isReferenceSchemaValid) {
    return referenceSchema;
  }
  return schema;
}
