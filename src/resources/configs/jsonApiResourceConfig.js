import _ from 'lodash';
import defaultResourceConfig from './defaultResourceConfig';

const jsonApiResourceConfig = _.merge({}, defaultResourceConfig, {
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

export default Object.freeze(jsonApiResourceConfig);
