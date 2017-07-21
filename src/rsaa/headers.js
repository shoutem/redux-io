import _ from 'lodash';

/**
 * Check if headers object supports entities() method.
 * @param {Headers} headers
 */
function isHeadersEntriesSupported(headers) {
  return (_.isFunction(headers.entries));
}

/**
 * Return existing or create new Headers object instance
 * @param {Headers|Object} headers
 */
function getHeadersInstance(headers) {
  if (headers instanceof Headers) {
    return headers;
  }

  return new Headers({ ...headers });
}

/**
 * Extract Request/Response headers into a plain object
 * @param {Object} response
 */
export function extractHeaders(resource) {
  if (!_.has(resource, 'headers')) {
    return {};
  }

  const headersInstance = getHeadersInstance(resource.headers);
  const headers = {};

  if (isHeadersEntriesSupported(headersInstance)) {
    const iterator = headersInstance.entries();
    for (let header = iterator.next(); !header.done; header = iterator.next()) {
      const [headerName, headerValue] = header.value;
      headers[headerName] = headerValue;
    }
  } else {
    headersInstance.forEach((headerValue, headerName) => {
      headers[headerName] = headerValue;
    });
  }

  return headers;
}
