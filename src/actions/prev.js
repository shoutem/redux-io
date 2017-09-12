import _ from 'lodash';
import { getCollectionLink, getCollectionParams } from '../reducers/collection';
import { getStatus } from '../status';
import { RESOLVED_ENDPOINT, NO_MORE_RESULTS } from '../consts';
import { find, APPEND_MODE } from './find';
import thunkAction from './_thunkAction';

/**
 * Create action for prev collection items in sequence from collection links.
 *
 * @param collection
 * @param appendMode
 * @param config
 * @returns {*}
 */
export function prev(collection, appendMode = true, config = {}) {
  const prevLink = getCollectionLink(collection, 'prev');
  const { schema, tag } = getStatus(collection);
  if (!prevLink) {
    return {
      type: NO_MORE_RESULTS,
      schema,
      tag,
    };
  }
  const findConfig = _.merge({
    request: {
      endpoint: prevLink,
    },
    schema,
  }, config);

  return find(findConfig, tag, getCollectionParams(collection), {
    [APPEND_MODE]: appendMode,
    [RESOLVED_ENDPOINT]: true,
  });
}

export default thunkAction(prev);
