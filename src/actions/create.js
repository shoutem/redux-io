import thunkAction from './_thunkAction';
import { execute } from './execute';

/**
 * Action creator used to create item on api (POST). Tag is not needed because all collection
 * with configured schema value as in argument of create will be invalidated upon successful
 * action of creating item on api.
 * @param schema can be name of schema or schema configuration. In both cases
 * rio resolves schema with registered schema configurations, and in case of schema
 * configuration passed in argument it merges two configuration objects. Schema configuration
 * object holds config.request attribute which is configuration based on RSAA
 * configuration from redux-api-middleware, allowing full customization expect types
 * part of configuration.
 * @param item holds object that you want to pass to api
 * @param params to be resolved in schema configuration endpoint. Params are first resolved
 * in endpoint if endpoint holds exact keys {param}, rest of params are resolved
 * as query params key=value
 * @returns {function}
 */
export function create(schema, item = null, params = {}, options = {}) {
  return execute(
    {
      name: 'create',
      actionTypes: 'CREATE',
      schema,
      item,
    },
    params,
    options,
  );
}

export default thunkAction(create);
