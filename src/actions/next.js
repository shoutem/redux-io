import { getCollectionLink, APPEND_MODE } from '../reducers/collection';
import { getStatus } from '../status';
import find from './find';

export default (collection, appendMode = true) => {
  const nextLink = getCollectionLink(collection, 'next');
  if (!nextLink) {
    return new Promise((resolve, reject) => reject('No next!'));
  }
  const { schema, tag } = getStatus(collection);
  const findConfig = {
    request: {
      endpoint: nextLink,
      headers: { 'Content-Type': 'application/vnd.api+json' },
    },
    schema,
  };
  return find(findConfig, tag, undefined, { [APPEND_MODE]: appendMode });
};
