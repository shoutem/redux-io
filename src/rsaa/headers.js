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
function getHeadersInstance(resource) {
  const headers = _.get(resource, 'headers');

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
  const headers = getHeadersInstance(resource);
  const extractedHeaders = {};

  if (isHeadersEntriesSupported(headers)) {
    for (const header of headers.entries()) {
      const [headerName, headerValue] = header;
      extractedHeaders[headerName] = headerValue;
    }
  } else {
    headers.forEach((headerValue, headerName) => {
      extractedHeaders[headerName] = headerValue;
    });
  }

  return extractedHeaders;
}
