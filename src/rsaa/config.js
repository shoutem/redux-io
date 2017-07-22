import _ from 'lodash';

/**
 * Creates new config with data pulled out from config request,
 * @param config
 * @returns config
 */
export function buildRSAAConfig(config) {
  const rsaaConfig = {
    endpoint: config.request.endpoint,
    headers: config.request.headers,
    types: config.request.types,
    method: config.request.method,
    body: config.request.body,
  };

  return _.omitBy(rsaaConfig, _.isNil);
}
