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
 * Extract response headers into a plan object
 * @param {Object} response
 */
export function extractResponseHeaders(response) {
  if (!response || !response.headers) {
    return {};
  }

  const headersInstance = getHeadersInstance(response.headers);
  const headers = {};
  let currentHeader = null;

  if (isHeadersEntriesSupported(headersInstance)) {
    // Headers extract implementation for React Native
    const iterator = headersInstance.entries();
    for (currentHeader = iterator.next(); !currentHeader.done; currentHeader = iterator.next()) {
      const [headerName, headerValue] = currentHeader.value;
      headers[headerName] = headerValue;
    }
  } else {
    // Headers extract implementation for Mocha tests
    headersInstance.forEach((headerValue, headerName) => {
      headers[headerName] = headerValue;
    });
  }

  return headers;
}

export function extendMetaWithResponse(meta) {
  return (action, state, res) => {
    const response = {
      status: res.status,
      headers: extractResponseHeaders(res),
    };

    return { ...meta, response };
  };
}
