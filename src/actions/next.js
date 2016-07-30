import { getCollectionLink, APPEND_MODE } from '../reducers/collection';
import { getStatus } from '../status';
import find from './find';

export const NO_MORE_RESULTS = '@@redux_io/NO_MORE_RESULTS';

/**
 * Create action for next collection items in sequence from collection links.
 *
 * @param collection
 * @param appendMode
 * @returns {*}
 */
export default function next(collection, appendMode = true) {
  const nextLink = getCollectionLink(collection, 'next');
  const { schema, tag } = getStatus(collection);
  if (!nextLink) {
    return {
      type: NO_MORE_RESULTS,
      schema,
      tag,
    };
  }
  const findConfig = {
    request: {
      endpoint: nextLink,
    },
    schema,
  };
  return find(findConfig, tag, undefined, { [APPEND_MODE]: appendMode });
}
