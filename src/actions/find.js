import _ from 'lodash';
import { execute } from './execute';
import thunkAction from './_thunkAction';

/**
 * If this options key is set to true, the data will be
 * appended to existing data in the state, instead of
 * overwriting it.
 */
export const APPEND_MODE = 'appendMode';

/**
 * Check if current dispatched action is in "append" mode.
 * @param {Object} action Current dispatched action
 */
export function isAppendMode(action) {
  return !!(_.get(action, ['meta', 'options', APPEND_MODE]));
}

/**
 * Action creator used to fetch data from api (GET).
 * @param schema can be name of schema or schema configuration. In both cases
 * rio resolves schema with registered schema configurations, and in case of schema
 * configuration passed in argument it merges two configuration objects. Schema configuration
 * object holds config.request attribute which is configuration based on RSAA
 * configuration from redux-api-middleware, allowing full customization expect types
 * part of configuration.
 * @param tag is optional, but when used allows your collections with same
 * tag value to respond on received data.
 * @param params to be resolved in schema configuration endpoint. Params are first resolved
 * in endpoint if endpoint holds exact keys {param}, rest of params are resolved
 * as query params key=value
 * @returns action
 */
export function find(schema, tag = '', ...otherArgs) {
  const resolvedSchema = _.isString(schema) ? { schema } : schema;

  return execute(
    {
      name: 'find',
      actionTypes: 'LOAD',
      tag,
      ...(!_.isEmpty(schema) ? resolvedSchema : {}),
    },
    ...otherArgs,
  );
}

export default thunkAction(find);
