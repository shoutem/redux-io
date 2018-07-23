import _ from 'lodash';
import baseResourceTypeConfig from './baseResourceTypeConfig';

export const JSON_API_RESOURCE = 'json-api';

const jsonApiResourceTypeConfig = _.merge({}, baseResourceTypeConfig, {
  type: JSON_API_RESOURCE,
  request: {
    headers: {
      Accept: 'application/vnd.api+json',
    },
  },
  actions: {
    create: {
      request: {
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      },
    },
    update: {
      request: {
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      },
    },
  },
});

export default Object.freeze(jsonApiResourceTypeConfig);
