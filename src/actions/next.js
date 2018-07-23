import _ from 'lodash';
import { getCollectionLink, getCollectionParams } from '../reducers/collection';
import { RESOLVED_ENDPOINT, NO_MORE_RESULTS } from '../consts';
import { getStatus } from '../status';
import { find, APPEND_MODE } from './find';
import thunkAction from './_thunkAction';

/**
 * Create action for next collection items in sequence from collection links.
 *
 * @param collection
 * @param appendMode
 * @param config
 * @returns {*}
 */
export function next(collection, appendMode = true, config = {}) {
  const nextLink = getCollectionLink(collection, 'next');
  const { schema, tag } = getStatus(collection);
  if (!nextLink) {
    return {
      type: NO_MORE_RESULTS,
      schema,
      tag,
    };
  }
  const findConfig = _.merge(
    {},
    {
      request: {
        endpoint: nextLink,
      },
      schema,
    },
    config
  );

  // We want to append the data to the data in the state, and we know that
  // the URL in the config already contains all the necessary query parameters
  // form the original request.
  // The original parameters are included in this action as well because some
  // reducers may use them to correctly process the request payload.
  return find(findConfig, tag, getCollectionParams(collection), {
    [APPEND_MODE]: appendMode,
    [RESOLVED_ENDPOINT]: true,
  });
}

export default thunkAction(next);
