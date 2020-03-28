import _ from 'lodash';
import { extractHeaders } from './headers';

export function extendMetaWithResponse(meta) {
  return (action, state, res) => {
    const response = {
      status: _.get(res, 'status'),
      headers: extractHeaders(res),
    };

    return { ...meta, response };
  };
}
